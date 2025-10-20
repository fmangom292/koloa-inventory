import { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ordersAPI } from '../utils/api';

/**
 * Modal para generar pedidos de reposición de productos
 * @function OrderModal
 * @param {Object} props - Props del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Array} props.items - Lista completa de productos del inventario
 * @returns {JSX.Element|null} Modal de pedidos o null si está cerrado
 * @description Componente que permite crear pedidos simplificados (sin precios)
 * para enviar a proveedores, con vista previa completa y PDF final simplificado
 */
const OrderModal = ({ isOpen, onClose, items }) => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [orderType, setOrderType] = useState('general'); // 'general', 'brand', or 'zeroStock'
  const [editableQuantities, setEditableQuantities] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Usar useMemo para evitar recálculos innecesarios
  const itemsNeedingRestock = useMemo(() => {
    return items.filter(item => item.stock < item.minStock && item.stock > 0);
  }, [items]);
  
  // Obtener marcas únicas de items que necesitan reposición
  const brandsNeedingRestock = useMemo(() => {
    return [...new Set(itemsNeedingRestock.map(item => item.marca))].sort();
  }, [itemsNeedingRestock]);

  // Inicializar cantidades editables solo cuando se abra el modal por primera vez
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const initialQuantities = {};
      itemsNeedingRestock.forEach(item => {
        initialQuantities[item.id] = Math.max(0, item.minStock - item.stock);
      });
      setEditableQuantities(initialQuantities);
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, itemsNeedingRestock, isInitialized]);

  /**
   * Actualiza la cantidad editable de un producto específico
   * @function updateQuantity
   * @param {number} itemId - ID del producto a actualizar
   * @param {string|number} newQuantity - Nueva cantidad como string o número
   * @returns {void} No retorna valor
   * @description Valida y actualiza la cantidad de un producto, asegurando que sea >= 0
   */
  // Función para actualizar cantidad de un item
  const updateQuantity = (itemId, newQuantity) => {
    const quantity = Math.max(0, parseInt(newQuantity) || 0);
    setEditableQuantities(prev => {
      const updated = {
        ...prev,
        [itemId]: quantity
      };
      return updated;
    });
  };

  if (!isOpen) return null;

  /**
   * Genera los datos del pedido general agrupados por marca
   * @function generateGeneralOrder
   * @returns {Array} Array de objetos con marca e items filtrados por cantidad > 0
   * @description Agrupa productos por marca y filtra solo los que tienen cantidad solicitada
   */
  // Generar pedido general agrupado por marca
  const generateGeneralOrder = () => {
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
          unitsNeeded: editableQuantities[item.id] || 0
        }))
        .filter(item => item.unitsNeeded > 0) // Solo incluir items con cantidad > 0
    })).filter(brandGroup => brandGroup.items.length > 0); // Solo marcas con items
  };

  /**
   * Genera los datos del pedido para una marca específica
   * @function generateBrandOrder
   * @param {string} brand - Nombre de la marca a procesar
   * @returns {Object} Objeto con marca e items filtrados por cantidad > 0
   * @description Filtra productos de una marca específica que tienen cantidad solicitada
   */
  // Generar pedido por marca específica
  const generateBrandOrder = (brand) => {
    const brandItems = itemsNeedingRestock.filter(item => item.marca === brand);
    const filteredItems = brandItems
      .map(item => ({
        ...item,
        unitsNeeded: editableQuantities[item.id] || 0
      }))
      .filter(item => item.unitsNeeded > 0); // Solo incluir items con cantidad > 0
    
    return {
      brand,
      items: filteredItems
    };
  };

  /**
   * Guarda el pedido en la base de datos
   * @function saveOrderToDatabase
   * @async
   * @param {string} type - Tipo de pedido ("general" o "brand")
   * @param {string|null} brand - Marca específica o null para pedidos generales
   * @returns {Promise<Object>} Pedido guardado o null si hay error
   * @description Crea un pedido en la base de datos con todos los items que tienen cantidad > 0
   */
  const saveOrderToDatabase = async (type, brand = null) => {
    try {
      setIsSaving(true);
      
      // Determinar qué items usar basándose en el tipo de pedido
      let itemsToProcess;
      if (type === 'brand' && brand) {
        // Para pedidos por marca, solo usar items de esa marca
        itemsToProcess = itemsNeedingRestock.filter(item => item.marca === brand);
      } else {
        // Para pedidos generales, usar todos los items
        itemsToProcess = itemsNeedingRestock;
      }
      
      // Preparar items del pedido (solo los que tienen cantidad > 0)
      const orderItems = itemsToProcess
        .filter(item => {
          const quantity = editableQuantities[item.id] || 0;
          return quantity > 0;
        })
        .map(item => ({
          inventoryItemId: item.id,
          quantityOrdered: editableQuantities[item.id]
        }));

      if (orderItems.length === 0) {
        throw new Error('No hay productos con cantidad para pedir');
      }

      const orderData = {
        type,
        brand,
        items: orderItems,
        notes: `Pedido generado desde ${type === 'general' ? 'modal general' : `modal de marca ${brand}`}`
      };

      const savedOrder = await ordersAPI.create(orderData);
      return savedOrder;
    } catch (error) {
      console.error('Error guardando pedido:', error);
      alert(`Error al guardar el pedido: ${error.message}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Crea un pedido general en la base de datos sin generar PDF
   * @function createGeneralOrder
   * @async
   * @returns {void} No retorna valor, cierra el modal y notifica resultado
   * @description Crea un pedido general en la base de datos, cierra el modal y notifica al usuario
   */
  const createGeneralOrder = async () => {
    const savedOrder = await saveOrderToDatabase('general');
    if (savedOrder) {
      alert(`✅ Pedido ${savedOrder.orderNumber} creado exitosamente. Ve a la sección de Pedidos para generar el PDF.`);
      onClose();
    }
  };

  /**
   * Crea un pedido por marca en la base de datos sin generar PDF
   * @function createBrandOrder
   * @async
   * @returns {void} No retorna valor, cierra el modal y notifica resultado
   * @description Crea un pedido de marca específica en la base de datos, cierra el modal y notifica al usuario
   */
  const createBrandOrder = async () => {
    if (!selectedBrand) return;
    
    const savedOrder = await saveOrderToDatabase('brand', selectedBrand);
    if (savedOrder) {
      alert(`✅ Pedido ${savedOrder.orderNumber} para la marca ${selectedBrand} creado exitosamente. Ve a la sección de Pedidos para generar el PDF.`);
      onClose();
    }
  };

  /**
   * Genera y descarga un PDF del pedido general con todas las marcas
   * @function generateGeneralOrderPDF
   * @returns {void} No retorna valor, descarga el archivo PDF
   * @description Crea un PDF profesional con productos agrupados por marca,
   * incluyendo solo nombre, peso y cantidad (sin precios). También guarda el pedido en BD.
   */
  // Generar PDF del pedido general
  const generateGeneralOrderPDF = async () => {
    // Primero guardar el pedido en la base de datos
    const savedOrder = await saveOrderToDatabase('general');
    if (!savedOrder) {
      return; // Error ya mostrado en saveOrderToDatabase
    }

    const doc = new jsPDF();
    const orderData = generateGeneralOrder();

    // Configurar fuente
    doc.setFont('helvetica');
    
    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('PEDIDO GENERAL DE TABACOS', 20, 25);
    
    // Información del documento
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha del pedido: ${new Date().toLocaleDateString('es-ES')}`, 20, 35);
    doc.text(`Número de pedido: ${savedOrder.orderNumber}`, 20, 40);
    doc.text(`Koloa Pub - Sistema de Inventario`, 20, 45);

    let yPosition = 60;
    let totalItems = 0;

    orderData.forEach((brandGroup, brandIndex) => {
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
      const tableData = brandGroup.items.map(item => {
        totalItems += item.unitsNeeded;
        return [
          item.nombre,
          `${item.peso}g`,
          `${item.unitsNeeded}`
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Producto', 'Peso', 'Cantidad']],
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

      yPosition = doc.lastAutoTable.finalY + 5;

      // Total de unidades de la marca
      const brandTotalUnits = brandGroup.items.reduce((sum, item) => sum + item.unitsNeeded, 0);
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(`Total unidades ${brandGroup.brand}: ${brandTotalUnits}`, 20, yPosition);
      yPosition += 15;
    });

    // Total general
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 25;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(220, 53, 69);
    doc.text(`TOTAL GENERAL DE UNIDADES: ${totalItems}`, 20, yPosition + 10);

    // Guardar PDF
    doc.save(`pedido-general-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  /**
   * Genera y descarga un PDF del pedido para una marca específica
   * @function generateBrandOrderPDF
   * @returns {void} No retorna valor, descarga el archivo PDF
   * @description Crea un PDF con productos de una sola marca,
   * formato simplificado con nombre, peso y cantidad. También guarda el pedido en BD.
   */
  // Generar PDF del pedido por marca
  const generateBrandOrderPDF = async () => {
    if (!selectedBrand) return;
    
    // Primero guardar el pedido en la base de datos
    const savedOrder = await saveOrderToDatabase('brand', selectedBrand);
    if (!savedOrder) {
      return; // Error ya mostrado en saveOrderToDatabase
    }
    
    const doc = new jsPDF();
    const orderData = generateBrandOrder(selectedBrand);

    // Configurar fuente
    doc.setFont('helvetica');
    
    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(`PEDIDO - ${selectedBrand}`, 20, 25);
    
    // Información del documento
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha del pedido: ${new Date().toLocaleDateString('es-ES')}`, 20, 35);
    doc.text(`Número de pedido: ${savedOrder.orderNumber}`, 20, 40);
    doc.text(`Koloa Pub - Sistema de Inventario`, 20, 45);

    // Tabla de productos
    const tableData = orderData.items.map(item => [
      item.nombre,
      `${item.peso}g`,
      `${item.unitsNeeded}`
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Producto', 'Peso', 'Cantidad']],
      body: tableData,
      styles: {
        fontSize: 12,
        cellPadding: 5,
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
    const totalUnits = orderData.items.reduce((sum, item) => sum + item.unitsNeeded, 0);
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(220, 53, 69);
    doc.text(`TOTAL UNIDADES ${selectedBrand}: ${totalUnits}`, 20, finalY);

    // Guardar PDF
    doc.save(`pedido-${selectedBrand.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-white">Generar Pedido</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Tipo de pedido */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-200 mb-3">Tipo de Pedido</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setOrderType('general')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  orderType === 'general'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Pedido General (Todas las marcas)
              </button>
              <button
                onClick={() => setOrderType('brand')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  orderType === 'brand'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Pedido por Marca
              </button>
            </div>
          </div>

          {/* Selección de marca (solo si es pedido por marca) */}
          {orderType === 'brand' && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-200 mb-3">Seleccionar Marca</h3>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona una marca...</option>
                {brandsNeedingRestock.map(brand => (
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
                  itemsNeedingRestock.forEach(item => {
                    newQuantities[item.id] = Math.max(0, item.minStock - item.stock);
                  });
                  setEditableQuantities(newQuantities);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                🔄 Restaurar cantidades sugeridas
              </button>
              <button
                onClick={() => {
                  const newQuantities = {};
                  itemsNeedingRestock.forEach(item => {
                    newQuantities[item.id] = 0;
                  });
                  setEditableQuantities(newQuantities);
                }}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                🗑️ Limpiar todo
              </button>
              <button
                onClick={() => {
                  const newQuantities = {};
                  itemsNeedingRestock.forEach(item => {
                    const suggested = Math.max(0, item.minStock - item.stock);
                    newQuantities[item.id] = Math.ceil(suggested * 1.5); // 50% extra
                  });
                  setEditableQuantities(newQuantities);
                }}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                📈 Pedir 50% extra
              </button>
            </div>
          </div>

          {/* Vista previa del pedido */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-200 mb-3">Vista Previa del Pedido</h3>
            <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto">
              {orderType === 'general' ? (
                <GeneralOrderPreview 
                  items={itemsNeedingRestock} 
                  editableQuantities={editableQuantities}
                  updateQuantity={updateQuantity}
                />
              ) : selectedBrand ? (
                <BrandOrderPreview 
                  items={itemsNeedingRestock} 
                  brand={selectedBrand}
                  editableQuantities={editableQuantities}
                  updateQuantity={updateQuantity}
                />
              ) : (
                <p className="text-gray-400">Selecciona una marca para ver la vista previa</p>
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
              onClick={orderType === 'general' ? createGeneralOrder : createBrandOrder}
              disabled={(orderType === 'brand' && !selectedBrand) || isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <span className="mr-2">📝</span>
              {isSaving ? 'Guardando...' : 'Crear Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de vista previa para pedidos generales con todas las marcas
 * @function GeneralOrderPreview
 * @param {Object} props - Props del componente
 * @param {Array} props.items - Lista de productos que necesitan reposición
 * @param {Object} props.editableQuantities - Objeto con cantidades editables por ID
 * @param {Function} props.updateQuantity - Función para actualizar cantidades
 * @returns {JSX.Element} Vista previa tabulada del pedido general
 * @description Muestra una tabla completa con stock, precios y totales para revisión interna
 */
// Componente para vista previa del pedido general
const GeneralOrderPreview = ({ items, editableQuantities, updateQuantity }) => {
  const groupedByBrand = items.reduce((acc, item) => {
    if (!acc[item.marca]) {
      acc[item.marca] = [];
    }
    acc[item.marca].push(item);
    return acc;
  }, {});

  const grandTotalUnits = items.reduce((sum, item) => {
    const unitsNeeded = editableQuantities[item.id] || 0;
    return sum + unitsNeeded;
  }, 0);

  const grandTotalPrice = items.reduce((sum, item) => {
    const unitsNeeded = editableQuantities[item.id] || 0;
    return sum + (item.precio * unitsNeeded);
  }, 0);

  return (
    <div className="text-sm">
      <h4 className="text-white font-semibold mb-4">Vista Previa del Pedido General</h4>
      {Object.keys(groupedByBrand).map(brand => {
        const brandItems = groupedByBrand[brand];
        const brandTotalUnits = brandItems.reduce((sum, item) => {
          const unitsNeeded = editableQuantities[item.id] || 0;
          return sum + unitsNeeded;
        }, 0);
        const brandTotalPrice = brandItems.reduce((sum, item) => {
          const unitsNeeded = editableQuantities[item.id] || 0;
          return sum + (item.precio * unitsNeeded);
        }, 0);
        
        return (
          <div key={brand} className="mb-6">
            <h5 className="text-green-400 font-medium mb-2">MARCA: {brand}</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-1 text-gray-400">Producto</th>
                    <th className="text-center py-1 text-gray-400">Stock</th>
                    <th className="text-center py-1 text-gray-400">Min</th>
                    <th className="text-center py-1 text-gray-400">Cantidad</th>
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
                            className="w-16 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-yellow-400 text-center text-xs focus:outline-none focus:border-green-500"
                          />
                        </td>
                        <td className="text-center py-1 text-gray-300">{item.peso}g</td>
                        <td className="text-center py-1 text-gray-300">{item.precio.toFixed(2)}€</td>
                        <td className="text-right py-1 text-blue-400">{totalPrice.toFixed(2)}€</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-2 space-y-1">
              <div><span className="text-yellow-400 font-medium">Total unidades {brand}: {brandTotalUnits}</span></div>
              <div><span className="text-blue-400 font-medium">Total precio {brand}: {brandTotalPrice.toFixed(2)}€</span></div>
            </div>
          </div>
        );
      })}
      <div className="border-t border-gray-700 pt-4 text-right space-y-2">
        <div><span className="text-green-400 font-bold text-lg">TOTAL GENERAL UNIDADES: {grandTotalUnits}</span></div>
        <div><span className="text-blue-400 font-bold text-lg">TOTAL GENERAL PRECIO: {grandTotalPrice.toFixed(2)}€</span></div>
      </div>
    </div>
  );
};

/**
 * Componente de vista previa para pedidos de una marca específica
 * @function BrandOrderPreview
 * @param {Object} props - Props del componente
 * @param {Array} props.items - Lista completa de productos del inventario
 * @param {string} props.brand - Nombre de la marca seleccionada
 * @param {Object} props.editableQuantities - Objeto con cantidades editables por ID
 * @param {Function} props.updateQuantity - Función para actualizar cantidades
 * @returns {JSX.Element} Vista previa tabulada del pedido por marca
 * @description Filtra y muestra productos de una marca con información completa para revisión
 */
// Componente para vista previa del pedido por marca
const BrandOrderPreview = ({ items, brand, editableQuantities, updateQuantity }) => {
  const brandItems = items.filter(item => item.marca === brand);
  const totalUnits = brandItems.reduce((sum, item) => {
    const unitsNeeded = editableQuantities[item.id] || 0;
    return sum + unitsNeeded;
  }, 0);
  const totalPrice = brandItems.reduce((sum, item) => {
    const unitsNeeded = editableQuantities[item.id] || 0;
    return sum + (item.precio * unitsNeeded);
  }, 0);

  return (
    <div className="text-sm">
      <h4 className="text-white font-semibold mb-4">Vista Previa del Pedido - {brand}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 text-gray-400">Producto</th>
              <th className="text-center py-2 text-gray-400">Stock Actual</th>
              <th className="text-center py-2 text-gray-400">Stock Mínimo</th>
              <th className="text-center py-2 text-gray-400">Cantidad</th>
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
                      className="w-16 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-yellow-400 text-center text-xs focus:outline-none focus:border-green-500"
                    />
                  </td>
                  <td className="text-center py-2 text-gray-300">{item.peso}g</td>
                  <td className="text-center py-2 text-gray-300">{item.precio.toFixed(2)}€</td>
                  <td className="text-right py-2 text-blue-400">{totalPrice.toFixed(2)}€</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-700 pt-4 text-right space-y-2">
        <div><span className="text-green-400 font-bold text-lg">TOTAL UNIDADES {brand}: {totalUnits}</span></div>
        <div><span className="text-blue-400 font-bold text-lg">TOTAL PRECIO {brand}: {totalPrice.toFixed(2)}€</span></div>
      </div>
    </div>
  );
};

export default OrderModal;