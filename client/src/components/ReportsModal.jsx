import { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ordersAPI } from '../utils/api';

const ReportsModal = ({ isOpen, onClose, items }) => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [reportType, setReportType] = useState('general'); // 'general', 'brand', or 'zeroStock'
  const [editableQuantities, setEditableQuantities] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Usar useMemo para evitar recálculos innecesarios
  const itemsNeedingRestock = useMemo(() => {
    return items.filter(item => item.stock < item.minStock);
  }, [items]);

  // Obtener tabacos con stock 0
  const tobaccoWithZeroStock = useMemo(() => {
    return items.filter(item => item.tipo === 'Tabaco' && item.stock === 0);
  }, [items]);
  
  // Obtener marcas únicas de items que necesitan reposición
  const brandsNeedingRestock = useMemo(() => {
    return [...new Set(itemsNeedingRestock.map(item => item.marca))].sort();
  }, [itemsNeedingRestock]);

  // Obtener marcas únicas de tabacos con stock 0
  const brandsWithZeroStock = useMemo(() => {
    return [...new Set(tobaccoWithZeroStock.map(item => item.marca))].sort();
  }, [tobaccoWithZeroStock]);

  // Inicializar cantidades editables solo cuando se abra el modal por primera vez
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const initialQuantities = {};
      if (reportType === 'zeroStock') {
        // Para tabacos con stock 0, inicializar con 1 unidad por defecto
        tobaccoWithZeroStock.forEach(item => {
          initialQuantities[item.id] = 1;
        });
      } else {
        // Para otros tipos de informe, usar la lógica original
        itemsNeedingRestock.forEach(item => {
          initialQuantities[item.id] = Math.max(0, item.minStock - item.stock);
        });
      }
      setEditableQuantities(initialQuantities);
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, itemsNeedingRestock, tobaccoWithZeroStock, isInitialized, reportType]);

  // Función para actualizar cantidad de un item
  const updateQuantity = (itemId, newQuantity) => {
    const quantity = Math.max(0, parseInt(newQuantity) || 0);
    setEditableQuantities(prev => {
      const updated = {
        ...prev,
        [itemId]: quantity
      };
      console.log('Actualizando cantidad:', { itemId, quantity, updated }); // Debug
      return updated;
    });
  };

  if (!isOpen) return null;

  // Generar informe general agrupado por marca
  const generateGeneralReport = () => {
    const groupedByBrand = itemsNeedingRestock.reduce((acc, item) => {
      if (!acc[item.marca]) {
        acc[item.marca] = [];
      }
      acc[item.marca].push(item);
      return acc;
    }, {});

    return Object.keys(groupedByBrand).map(brand => ({
      brand,
      items: groupedByBrand[brand]
        .map(item => ({
          ...item,
          unitsNeeded: editableQuantities[item.id] || 0,
          totalPrice: item.precio * (editableQuantities[item.id] || 0)
        }))
        .filter(item => item.unitsNeeded > 0), // Solo incluir items con cantidad > 0
      totalBrand: groupedByBrand[brand].reduce((sum, item) => {
        const unitsNeeded = editableQuantities[item.id] || 0;
        return sum + (item.precio * unitsNeeded);
      }, 0)
    })).filter(brandGroup => brandGroup.items.length > 0); // Solo marcas con items
  };

  // Generar informe por marca específica
  const generateBrandReport = (brand) => {
    const brandItems = itemsNeedingRestock.filter(item => item.marca === brand);
    const filteredItems = brandItems
      .map(item => ({
        ...item,
        unitsNeeded: editableQuantities[item.id] || 0,
        totalPrice: item.precio * (editableQuantities[item.id] || 0)
      }))
      .filter(item => item.unitsNeeded > 0); // Solo incluir items con cantidad > 0
    
    return {
      brand,
      items: filteredItems,
      total: brandItems.reduce((sum, item) => {
        const unitsNeeded = editableQuantities[item.id] || 0;
        return sum + (item.precio * unitsNeeded);
      }, 0)
    };
  };

  // Generar informe de tabacos con stock 0
  const generateZeroStockReport = (brand = null) => {
    const filteredItems = brand 
      ? tobaccoWithZeroStock.filter(item => item.marca === brand)
      : tobaccoWithZeroStock;
    
    const itemsWithQuantities = filteredItems
      .map(item => ({
        ...item,
        unitsNeeded: editableQuantities[item.id] || 0,
        totalPrice: item.precio * (editableQuantities[item.id] || 0)
      }))
      .filter(item => item.unitsNeeded > 0); // Solo incluir items con cantidad > 0

    if (brand) {
      return {
        brand,
        items: itemsWithQuantities,
        total: filteredItems.reduce((sum, item) => {
          const unitsNeeded = editableQuantities[item.id] || 0;
          return sum + (item.precio * unitsNeeded);
        }, 0)
      };
    } else {
      // Agrupar por marca para informe general de stock 0
      const groupedByBrand = filteredItems.reduce((acc, item) => {
        if (!acc[item.marca]) {
          acc[item.marca] = [];
        }
        acc[item.marca].push(item);
        return acc;
      }, {});

      return Object.keys(groupedByBrand).map(brandName => ({
        brand: brandName,
        items: groupedByBrand[brandName]
          .map(item => ({
            ...item,
            unitsNeeded: editableQuantities[item.id] || 0,
            totalPrice: item.precio * (editableQuantities[item.id] || 0)
          }))
          .filter(item => item.unitsNeeded > 0),
        totalBrand: groupedByBrand[brandName].reduce((sum, item) => {
          const unitsNeeded = editableQuantities[item.id] || 0;
          return sum + (item.precio * unitsNeeded);
        }, 0)
      })).filter(brandGroup => brandGroup.items.length > 0);
    }
  };

  // Generar PDF del informe general
  const generateGeneralPDF = () => {
    const doc = new jsPDF();
    const reportData = generateGeneralReport();
    const grandTotal = reportData.reduce((sum, brandGroup) => sum + brandGroup.totalBrand, 0);

    // Configurar fuente
    doc.setFont('helvetica');
    
    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('INFORME DE REPOSICIÓN GENERAL', 20, 25);
    
    // Información del documento
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 20, 35);
    doc.text(`Koloa Inventory System`, 20, 40);

    let yPosition = 55;

    reportData.forEach((brandGroup, brandIndex) => {
      // Verificar si necesitamos nueva página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 25;
      }

      // Título de la marca
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(`MARCA: ${brandGroup.brand}`, 20, yPosition);
      yPosition += 10;

      // Tabla de productos de la marca
      const tableData = brandGroup.items.map(item => [
        item.nombre,
        `${item.stock}`,
        `${item.minStock}`,
        `${item.unitsNeeded}`,
        `${item.peso}g`,
        `${item.precio.toFixed(2)}€`,
        `${item.totalPrice.toFixed(2)}€`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Producto', 'Stock Actual', 'Stock Mínimo', 'Unidades Necesarias', 'Peso', 'Precio Unit.', 'Precio Total']],
        body: tableData,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 5;

      // Total de la marca
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(`Total ${brandGroup.brand}: ${brandGroup.totalBrand.toFixed(2)}€`, 20, yPosition);
      yPosition += 15;
    });

    // Total general
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 25;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(220, 53, 69);
    doc.text(`TOTAL GENERAL DEL PEDIDO: ${grandTotal.toFixed(2)}€`, 20, yPosition + 10);

    // Guardar PDF
    doc.save(`informe-reposicion-general-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generar PDF del informe por marca
  const generateBrandPDF = () => {
    if (!selectedBrand) return;
    
    const doc = new jsPDF();
    const reportData = generateBrandReport(selectedBrand);

    // Configurar fuente
    doc.setFont('helvetica');
    
    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(`INFORME DE REPOSICIÓN - ${selectedBrand}`, 20, 25);
    
    // Información del documento
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 20, 35);
    doc.text(`Koloa Inventory System`, 20, 40);

    // Tabla de productos
    const tableData = reportData.items.map(item => [
      item.nombre,
      `${item.stock}`,
      `${item.minStock}`,
      `${item.unitsNeeded}`,
      `${item.peso}g`,
      `${item.precio.toFixed(2)}€`,
      `${item.totalPrice.toFixed(2)}€`
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Producto', 'Stock Actual', 'Stock Mínimo', 'Unidades Necesarias', 'Peso', 'Precio Unit.', 'Precio Total']],
      body: tableData,
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 }
    });

    // Total
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(220, 53, 69);
    doc.text(`TOTAL ${selectedBrand}: ${reportData.total.toFixed(2)}€`, 20, finalY);

    // Guardar PDF
    doc.save(`informe-reposicion-${selectedBrand.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generar PDF del informe de tabacos con stock 0
  const generateZeroStockPDF = () => {
    const doc = new jsPDF();
    
    if (selectedBrand) {
      // Informe por marca específica de tabacos con stock 0
      const reportData = generateZeroStockReport(selectedBrand);

      // Configurar fuente
      doc.setFont('helvetica');
      
      // Título principal
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text(`TABACOS SIN STOCK - ${selectedBrand}`, 20, 25);
      
      // Información del documento
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 20, 35);
      doc.text(`Koloa Inventory System`, 20, 40);

      // Tabla de productos
      const tableData = reportData.items.map(item => [
        item.nombre,
        `${item.stock}`,
        `${item.minStock}`,
        `${item.peso}g`,
        `${item.unitsNeeded}`,
        `${item.precio.toFixed(2)}€`,
        `${item.totalPrice.toFixed(2)}€`
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['Producto', 'Stock', 'Stock Mín.', 'Peso', 'Unidades a Pedir', 'Precio Unit.', 'Precio Total']],
        body: tableData,
        styles: {
          fontSize: 10,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [220, 53, 69],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 }
      });

      // Total
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(16);
      doc.setTextColor(220, 53, 69);
      doc.text(`TOTAL ${selectedBrand}: ${reportData.total.toFixed(2)}€`, 20, finalY);

      // Guardar PDF
      doc.save(`tabacos-sin-stock-${selectedBrand.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    } else {
      // Informe general de todas las marcas con tabacos sin stock
      const reportData = generateZeroStockReport();
      const grandTotal = reportData.reduce((sum, brandGroup) => sum + brandGroup.totalBrand, 0);

      // Configurar fuente
      doc.setFont('helvetica');
      
      // Título principal
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('TABACOS SIN STOCK - TODAS LAS MARCAS', 20, 25);
      
      // Información del documento
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 20, 35);
      doc.text(`Koloa Inventory System`, 20, 40);

      let yPosition = 55;

      reportData.forEach((brandGroup) => {
        // Verificar si necesitamos nueva página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 25;
        }

        // Título de la marca
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text(`MARCA: ${brandGroup.brand}`, 20, yPosition);
        yPosition += 10;

        // Tabla de productos de la marca
        const tableData = brandGroup.items.map(item => [
          item.nombre,
          `${item.stock}`,
          `${item.minStock}`,
          `${item.peso}g`,
          `${item.unitsNeeded}`,
          `${item.precio.toFixed(2)}€`,
          `${item.totalPrice.toFixed(2)}€`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Producto', 'Stock', 'Stock Mín.', 'Peso', 'Unidades a Pedir', 'Precio Unit.', 'Precio Total']],
          body: tableData,
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [220, 53, 69],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: 20, right: 20 }
        });

        yPosition = doc.lastAutoTable.finalY + 5;

        // Total de la marca
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        doc.text(`Total ${brandGroup.brand}: ${brandGroup.totalBrand.toFixed(2)}€`, 20, yPosition);
        yPosition += 15;
      });

      // Total general
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 25;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(220, 53, 69);
      doc.text(`TOTAL GENERAL: ${grandTotal.toFixed(2)}€`, 20, yPosition + 10);

      // Guardar PDF
      doc.save(`tabacos-sin-stock-general-${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-white">Informes de Reposición</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Tipo de informe */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-200 mb-3">Tipo de Informe</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => setReportType('general')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  reportType === 'general'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Informe General <span className="hidden sm:inline">(Todas las marcas)</span>
              </button>
              <button
                onClick={() => setReportType('brand')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  reportType === 'brand'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Informe por Marca
              </button>
              <button
                onClick={() => setReportType('zeroStock')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  reportType === 'zeroStock'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Tabacos Stock 0
              </button>
            </div>
          </div>

          {/* Selección de marca (solo si es informe por marca o tabacos stock 0) */}
          {(reportType === 'brand' || reportType === 'zeroStock') && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-200 mb-3">Seleccionar Marca</h3>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {reportType === 'zeroStock' ? 'Todas las marcas con stock 0' : 'Selecciona una marca...'}
                </option>
                {(reportType === 'zeroStock' ? brandsWithZeroStock : brandsNeedingRestock).map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          )}

          {/* Botones de utilidad */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-200 mb-3">Acciones Rápidas</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const newQuantities = {};
                  const itemsToProcess = reportType === 'zeroStock' ? tobaccoWithZeroStock : itemsNeedingRestock;
                  itemsToProcess.forEach(item => {
                    if (reportType === 'zeroStock') {
                      newQuantities[item.id] = 1; // Para tabacos con stock 0, sugerir 1 unidad
                    } else {
                      newQuantities[item.id] = Math.max(0, item.minStock - item.stock);
                    }
                  });
                  setEditableQuantities(newQuantities);
                  console.log('Restaurando cantidades sugeridas:', newQuantities); // Debug
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                🔄 Restaurar cantidades sugeridas
              </button>
              <button
                onClick={() => {
                  const newQuantities = {};
                  const itemsToProcess = reportType === 'zeroStock' ? tobaccoWithZeroStock : itemsNeedingRestock;
                  itemsToProcess.forEach(item => {
                    newQuantities[item.id] = 0;
                  });
                  setEditableQuantities(newQuantities);
                  console.log('Limpiando todo:', newQuantities); // Debug
                }}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                🗑️ Limpiar todo
              </button>
              {reportType !== 'zeroStock' && (
                <button
                  onClick={() => {
                    const newQuantities = {};
                    itemsNeedingRestock.forEach(item => {
                      const suggested = Math.max(0, item.minStock - item.stock);
                      newQuantities[item.id] = Math.ceil(suggested * 1.5); // 50% extra
                    });
                    setEditableQuantities(newQuantities);
                    console.log('Pidiendo 50% extra:', newQuantities); // Debug
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  📈 Pedir 50% extra
                </button>
              )}
            </div>
          </div>

          {/* Vista previa del informe */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-200 mb-3">Vista Previa</h3>
            <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto">
              {reportType === 'general' ? (
                <GeneralReportPreview 
                  items={itemsNeedingRestock} 
                  editableQuantities={editableQuantities}
                  updateQuantity={updateQuantity}
                />
              ) : reportType === 'brand' && selectedBrand ? (
                <BrandReportPreview 
                  items={itemsNeedingRestock} 
                  brand={selectedBrand}
                  editableQuantities={editableQuantities}
                  updateQuantity={updateQuantity}
                />
              ) : reportType === 'zeroStock' ? (
                selectedBrand ? (
                  <ZeroStockReportPreview 
                    items={tobaccoWithZeroStock} 
                    brand={selectedBrand}
                    editableQuantities={editableQuantities}
                    updateQuantity={updateQuantity}
                  />
                ) : (
                  <ZeroStockGeneralReportPreview 
                    items={tobaccoWithZeroStock} 
                    editableQuantities={editableQuantities}
                    updateQuantity={updateQuantity}
                  />
                )
              ) : (
                <p className="text-gray-400">
                  {reportType === 'brand' ? 'Selecciona una marca para ver la vista previa' : 'Vista previa no disponible'}
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (reportType === 'general') {
                  generateGeneralPDF();
                } else if (reportType === 'brand') {
                  generateBrandPDF();
                } else if (reportType === 'zeroStock') {
                  generateZeroStockPDF();
                }
              }}
              disabled={(reportType === 'brand' && !selectedBrand)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <span className="mr-2">📄</span>
              Generar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para vista previa del informe general
const GeneralReportPreview = ({ items, editableQuantities, updateQuantity }) => {
  const groupedByBrand = items.reduce((acc, item) => {
    if (!acc[item.marca]) {
      acc[item.marca] = [];
    }
    acc[item.marca].push(item);
    return acc;
  }, {});

  const grandTotal = items.reduce((sum, item) => {
    const unitsNeeded = editableQuantities[item.id] || 0;
    return sum + (item.precio * unitsNeeded);
  }, 0);

  return (
    <div className="text-sm">
      <h4 className="text-white font-semibold mb-4">Informe General de Reposición</h4>
      {Object.keys(groupedByBrand).map(brand => {
        const brandItems = groupedByBrand[brand];
        const brandTotal = brandItems.reduce((sum, item) => {
          const unitsNeeded = editableQuantities[item.id] || 0;
          return sum + (item.precio * unitsNeeded);
        }, 0);
        
        return (
          <div key={brand} className="mb-6">
            <h5 className="text-blue-400 font-medium mb-2">MARCA: {brand}</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-1 text-gray-400">Producto</th>
                    <th className="text-center py-1 text-gray-400">Stock</th>
                    <th className="text-center py-1 text-gray-400">Min</th>
                    <th className="text-center py-1 text-gray-400">Necesarias</th>
                    <th className="text-center py-1 text-gray-400">Peso</th>
                    <th className="text-center py-1 text-gray-400">P. Unit.</th>
                    <th className="text-right py-1 text-gray-400">P. Total</th>
                  </tr>
                </thead>
                <tbody>
                  {brandItems.map(item => {
                    const unitsNeeded = editableQuantities[item.id] || 0;
                    const totalPrice = item.precio * unitsNeeded;
                    return (
                      <tr key={item.id} className="border-b border-gray-800">
                        <td className="py-1 text-gray-300">{item.nombre}</td>
                        <td className="text-center py-1 text-red-400">{item.stock}</td>
                        <td className="text-center py-1 text-gray-300">{item.minStock}</td>
                        <td className="text-center py-1">
                          <input
                            type="number"
                            min="0"
                            value={unitsNeeded}
                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                            className="w-16 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-yellow-400 text-center text-xs focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="text-center py-1 text-gray-300">{item.peso}g</td>
                        <td className="text-center py-1 text-gray-300">{item.precio.toFixed(2)}€</td>
                        <td className="text-right py-1 text-green-400">{totalPrice.toFixed(2)}€</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-2">
              <span className="text-yellow-400 font-medium">Total {brand}: {brandTotal.toFixed(2)}€</span>
            </div>
          </div>
        );
      })}
      <div className="border-t border-gray-700 pt-4 text-right">
        <span className="text-red-400 font-bold text-lg">TOTAL GENERAL: {grandTotal.toFixed(2)}€</span>
      </div>
    </div>
  );
};

// Componente para vista previa del informe por marca
const BrandReportPreview = ({ items, brand, editableQuantities, updateQuantity }) => {
  const brandItems = items.filter(item => item.marca === brand);
  const total = brandItems.reduce((sum, item) => {
    const unitsNeeded = editableQuantities[item.id] || 0;
    return sum + (item.precio * unitsNeeded);
  }, 0);

  return (
    <div className="text-sm">
      <h4 className="text-white font-semibold mb-4">Informe de Reposición - {brand}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 text-gray-400">Producto</th>
              <th className="text-center py-2 text-gray-400">Stock Actual</th>
              <th className="text-center py-2 text-gray-400">Stock Mínimo</th>
              <th className="text-center py-2 text-gray-400">Unidades Necesarias</th>
              <th className="text-center py-2 text-gray-400">Peso</th>
              <th className="text-center py-2 text-gray-400">Precio Unit.</th>
              <th className="text-right py-2 text-gray-400">Precio Total</th>
            </tr>
          </thead>
          <tbody>
            {brandItems.map(item => {
              const unitsNeeded = editableQuantities[item.id] || 0;
              const totalPrice = item.precio * unitsNeeded;
              return (
                <tr key={item.id} className="border-b border-gray-800">
                  <td className="py-2 text-gray-300">{item.nombre}</td>
                  <td className="text-center py-2 text-red-400">{item.stock}</td>
                  <td className="text-center py-2 text-gray-300">{item.minStock}</td>
                  <td className="text-center py-2">
                    <input
                      type="number"
                      min="0"
                      value={unitsNeeded}
                      onChange={(e) => updateQuantity(item.id, e.target.value)}
                      className="w-16 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-yellow-400 text-center text-xs focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="text-center py-2 text-gray-300">{item.peso}g</td>
                  <td className="text-center py-2 text-gray-300">{item.precio.toFixed(2)}€</td>
                  <td className="text-right py-2 text-green-400">{totalPrice.toFixed(2)}€</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-700 pt-4 text-right">
        <span className="text-red-400 font-bold text-lg">TOTAL {brand}: {total.toFixed(2)}€</span>
      </div>
    </div>
  );
};

// Componente para vista previa del informe general de tabacos con stock 0
const ZeroStockGeneralReportPreview = ({ items, editableQuantities, updateQuantity }) => {
  const groupedByBrand = items.reduce((acc, item) => {
    if (!acc[item.marca]) {
      acc[item.marca] = [];
    }
    acc[item.marca].push(item);
    return acc;
  }, {});

  const grandTotal = items.reduce((sum, item) => {
    const unitsNeeded = editableQuantities[item.id] || 0;
    return sum + (item.precio * unitsNeeded);
  }, 0);

  return (
    <div className="text-sm">
      <h4 className="text-white font-semibold mb-4">Tabacos sin Stock - Todas las Marcas</h4>
      {Object.keys(groupedByBrand).map(brand => {
        const brandItems = groupedByBrand[brand];
        const brandTotal = brandItems.reduce((sum, item) => {
          const unitsNeeded = editableQuantities[item.id] || 0;
          return sum + (item.precio * unitsNeeded);
        }, 0);
        
        return (
          <div key={brand} className="mb-6">
            <h5 className="text-red-400 font-medium mb-2">MARCA: {brand}</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-1 text-gray-400">Producto</th>
                    <th className="text-center py-1 text-gray-400">Stock</th>
                    <th className="text-center py-1 text-gray-400">Min</th>
                    <th className="text-center py-1 text-gray-400">Peso</th>
                    <th className="text-center py-1 text-gray-400">Unidades a Pedir</th>
                    <th className="text-center py-1 text-gray-400">P. Unit.</th>
                    <th className="text-right py-1 text-gray-400">P. Total</th>
                  </tr>
                </thead>
                <tbody>
                  {brandItems.map(item => {
                    const unitsNeeded = editableQuantities[item.id] || 0;
                    const totalPrice = item.precio * unitsNeeded;
                    return (
                      <tr key={item.id} className="border-b border-gray-800">
                        <td className="py-1 text-gray-300">{item.nombre}</td>
                        <td className="text-center py-1 text-red-400">{item.stock}</td>
                        <td className="text-center py-1 text-gray-300">{item.minStock}</td>
                        <td className="text-center py-1 text-gray-300">{item.peso}g</td>
                        <td className="text-center py-1">
                          <input
                            type="number"
                            min="0"
                            value={unitsNeeded}
                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                            className="w-16 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-yellow-400 text-center text-xs focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="text-center py-1 text-gray-300">{item.precio.toFixed(2)}€</td>
                        <td className="text-right py-1 text-green-400">{totalPrice.toFixed(2)}€</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-2">
              <span className="text-yellow-400 font-medium">Total {brand}: {brandTotal.toFixed(2)}€</span>
            </div>
          </div>
        );
      })}
      <div className="border-t border-gray-700 pt-4 text-right">
        <span className="text-red-400 font-bold text-lg">TOTAL GENERAL: {grandTotal.toFixed(2)}€</span>
      </div>
    </div>
  );
};

// Componente para vista previa del informe de tabacos con stock 0 por marca
const ZeroStockReportPreview = ({ items, brand, editableQuantities, updateQuantity }) => {
  const brandItems = items.filter(item => item.marca === brand);
  const total = brandItems.reduce((sum, item) => {
    const unitsNeeded = editableQuantities[item.id] || 0;
    return sum + (item.precio * unitsNeeded);
  }, 0);

  return (
    <div className="text-sm">
      <h4 className="text-white font-semibold mb-4">Tabacos sin Stock - {brand}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 text-gray-400">Producto</th>
              <th className="text-center py-2 text-gray-400">Stock</th>
              <th className="text-center py-2 text-gray-400">Stock Mínimo</th>
              <th className="text-center py-2 text-gray-400">Peso</th>
              <th className="text-center py-2 text-gray-400">Unidades a Pedir</th>
              <th className="text-center py-2 text-gray-400">Precio Unit.</th>
              <th className="text-right py-2 text-gray-400">Precio Total</th>
            </tr>
          </thead>
          <tbody>
            {brandItems.map(item => {
              const unitsNeeded = editableQuantities[item.id] || 0;
              const totalPrice = item.precio * unitsNeeded;
              return (
                <tr key={item.id} className="border-b border-gray-800">
                  <td className="py-2 text-gray-300">{item.nombre}</td>
                  <td className="text-center py-2 text-red-400">{item.stock}</td>
                  <td className="text-center py-2 text-gray-300">{item.minStock}</td>
                  <td className="text-center py-2 text-gray-300">{item.peso}g</td>
                  <td className="text-center py-2">
                    <input
                      type="number"
                      min="0"
                      value={unitsNeeded}
                      onChange={(e) => updateQuantity(item.id, e.target.value)}
                      className="w-16 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-yellow-400 text-center text-xs focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="text-center py-2 text-gray-300">{item.precio.toFixed(2)}€</td>
                  <td className="text-right py-2 text-green-400">{totalPrice.toFixed(2)}€</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-700 pt-4 text-right">
        <span className="text-red-400 font-bold text-lg">TOTAL {brand}: {total.toFixed(2)}€</span>
      </div>
    </div>
  );
};

export default ReportsModal;