import { useState, useEffect } from 'react';
import { ordersAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import jsPDF from 'jspdf';

/**
 * Página principal para gestionar pedidos de reposición
 * @function OrdersPage
 * @param {Object} props - Props del componente
 * @param {Function} props.refreshInventory - Función para refrescar el inventario
 * @returns {JSX.Element} Página con lista de pedidos, filtros y acciones
 * @description Componente que muestra todos los pedidos con opciones para filtrar,
 * confirmar recepción y ver detalles de cada pedido
 */
const OrdersPage = ({ refreshInventory }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed', 'cancelled'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(null);
  const [confirmNotes, setConfirmNotes] = useState('');

  /**
   * Carga todos los pedidos desde la API
   * @function fetchOrders
   * @async
   * @returns {Promise<void>} No retorna valor
   */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getAll();
      // Validar que data sea un array antes de establecerlo
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Error cargando pedidos');
      setOrders([]); // Asegurar que orders sea siempre un array
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /**
   * Filtra los pedidos según el filtro seleccionado
   * @function filteredOrders
   * @returns {Array} Lista de pedidos filtrada
   */
  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  }) : [];

  /**
   * Confirma la recepción de un pedido
   * @function handleConfirmOrder
   * @async
   * @param {Object} order - Pedido a confirmar
   * @returns {Promise<void>} No retorna valor
   */
  const handleConfirmOrder = async (order) => {
    setConfirmingOrder(order);
    setShowConfirmModal(true);
  };

  /**
   * Ejecuta la confirmación del pedido con notas opcionales
   * @function executeConfirmation
   * @async
   * @returns {Promise<void>} No retorna valor
   */
  const executeConfirmation = async () => {
    try {
      setLoading(true);
      const result = await ordersAPI.confirm(confirmingOrder.id, { 
        notes: confirmNotes 
      });
      
      // Actualizar la lista de pedidos
      await fetchOrders();
      
      // Refrescar el inventario en el Dashboard
      if (refreshInventory) {
        await refreshInventory();
      }
      
      // Mostrar mensaje de éxito
      alert(`Pedido ${confirmingOrder.orderNumber} confirmado. Stock actualizado para ${result.stockUpdates.length} productos.`);
      
      // Cerrar modal
      setShowConfirmModal(false);
      setConfirmingOrder(null);
      setConfirmNotes('');
    } catch (error) {
      alert(`Error confirmando pedido: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancela un pedido pendiente
   * @function handleCancelOrder
   * @async
   * @param {Object} order - Pedido a cancelar
   * @returns {Promise<void>} No retorna valor
   */
  const handleCancelOrder = async (order) => {
    const reason = prompt(`¿Razón para cancelar el pedido ${order.orderNumber}?`);
    if (reason === null) return; // Usuario canceló

    try {
      setLoading(true);
      await ordersAPI.cancel(order.id, { reason });
      await fetchOrders();
      alert(`Pedido ${order.orderNumber} cancelado.`);
    } catch (error) {
      alert(`Error cancelando pedido: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Muestra los detalles de un pedido en modal
   * @function handleViewDetails
   * @param {Object} order - Pedido a mostrar
   * @returns {void} No retorna valor
   */
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  /**
   * Genera un PDF con los detalles del pedido
   * @function handleGeneratePDF
   * @param {Object} order - Objeto del pedido a generar PDF
   * @returns {void} No retorna valor
   */
  const handleGeneratePDF = (order) => {
    try {
      // Validar que el pedido tenga items
      if (!order.items || order.items.length === 0) {
        alert('El pedido no tiene items para generar el PDF.');
        return;
      }

      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const lineHeight = 8;
      const bottomMargin = 30;
      
      // Colores del tema
      const colors = {
        primary: [41, 128, 185],     // Azul
        secondary: [52, 73, 94],     // Gris oscuro
        accent: [230, 126, 34],      // Naranja
        success: [46, 204, 113],     // Verde
        text: [44, 62, 80],          // Gris muy oscuro
        lightGray: [236, 240, 241],  // Gris claro
        white: [255, 255, 255]
      };
      
      /**
       * Añade una nueva página si es necesario
       * @param {number} currentY - Posición Y actual
       * @param {number} requiredSpace - Espacio requerido
       * @returns {number} Nueva posición Y
       */
      const checkAndAddPage = (currentY, requiredSpace = lineHeight) => {
        if (currentY + requiredSpace > pageHeight - bottomMargin) {
          doc.addPage();
          addHeaderBackground();
          return margin + 40; // Margen superior en nueva página después del header
        }
        return currentY;
      };
      
      /**
       * Añade el fondo decorativo del header
       */
      const addHeaderBackground = () => {
        // Fondo azul degradado (simulado con rectángulos)
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        // Línea decorativa
        doc.setFillColor(...colors.accent);
        doc.rect(0, 32, pageWidth, 3, 'F');
        
        // Logo/texto del pub
        doc.setTextColor(...colors.white);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('KOLOA PUB', pageWidth / 2, 22, { align: 'center' });
      };
      
      /**
       * Añade el encabezado de la tabla con estilo
       * @param {number} yPos - Posición Y donde añadir el encabezado
       * @returns {number} Nueva posición Y después del encabezado
       */
      const addTableHeader = (yPos) => {
        yPos = checkAndAddPage(yPos, 25);
        
        // Fondo del header de tabla
        doc.setFillColor(...colors.secondary);
        doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 18, 'F');
        
        // Texto del header
        doc.setTextColor(...colors.white);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUCTO', margin + 3, yPos + 6);
        doc.text('MARCA', margin + 70, yPos + 6);
        doc.text('PESO', margin + 120, yPos + 6);
        doc.text('CANTIDAD', margin + 150, yPos + 6);
        
        return yPos + 20;
      };
      
      /**
       * Añade una fila de item con estilo alternado
       * @param {Object} item - Item del pedido
       * @param {number} yPos - Posición Y
       * @param {boolean} isEven - Si es fila par (para alternancia)
       * @returns {number} Nueva posición Y
       */
      const addItemRow = (item, yPos, isEven) => {
        // Fondo alternado para las filas
        if (isEven) {
          doc.setFillColor(...colors.lightGray);
          doc.rect(margin, yPos - 3, pageWidth - (margin * 2), lineHeight + 2, 'F');
        }
        
        // Texto de la fila
        doc.setTextColor(...colors.text);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Truncar nombre del producto si es muy largo
        const productName = item.inventoryItem.nombre.length > 20 
          ? item.inventoryItem.nombre.substring(0, 17) + '...'
          : item.inventoryItem.nombre;
        
        // Truncar marca si es muy larga
        const brandName = item.inventoryItem.marca.length > 15 
          ? item.inventoryItem.marca.substring(0, 12) + '...'
          : item.inventoryItem.marca;
        
        doc.text(productName, margin + 3, yPos + 3);
        doc.text(brandName, margin + 70, yPos + 3);
        doc.text(`${item.inventoryItem.peso}g`, margin + 120, yPos + 3);
        doc.text((item.quantityOrdered || 0).toString(), margin + 155, yPos + 3, { align: 'center' });
        
        return yPos + lineHeight + 2;
      };
      
      // === INICIO DEL DOCUMENTO ===
      
      // Header principal con fondo
      addHeaderBackground();
      
      // Título del documento
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PEDIDO DE REPOSICIÓN', pageWidth / 2, 32, { align: 'center' });
      
      // Reset color para el contenido
      doc.setTextColor(...colors.text);
      
      // Posición inicial para la tabla
      let yPosition = 60;
      
      // Título de la tabla
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.secondary);
      doc.text('PRODUCTOS SOLICITADOS', margin, yPosition);
      yPosition += 15;
      
      // Encabezado de tabla
      yPosition = addTableHeader(yPosition);
      
      // Items del pedido
      let itemsPerPage = 0;
      const maxItemsPerPage = 25; // Más items por página con el nuevo diseño
      
      order.items.forEach((item, index) => {
        // Verificar si necesitamos una nueva página
        yPosition = checkAndAddPage(yPosition, lineHeight + 5);
        
        // Si acabamos de añadir una nueva página, añadir encabezado de tabla
        if (itemsPerPage >= maxItemsPerPage || yPosition <= margin + 50) {
          if (yPosition <= margin + 50) {
            yPosition = addTableHeader(yPosition);
          }
          itemsPerPage = 0;
        }
        
        yPosition = addItemRow(item, yPosition, index % 2 === 0);
        itemsPerPage++;
      });
      
      // Espacio adicional después de la tabla
      yPosition += 20;
      
      // Nota final
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('Este pedido fue generado automaticamente por el sistema de gestion de inventario.', 
               margin, yPosition);
      
      // Pie de página en todas las páginas
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Línea decorativa en el pie
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(1);
        doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
        
        // Texto del pie
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.secondary);
        doc.text(
          'Koloa Pub - Sistema de Gestion de Inventario', 
          pageWidth / 2, 
          pageHeight - 12, 
          { align: 'center' }
        );
        doc.text(
          `Página ${i} de ${totalPages}`, 
          pageWidth - margin, 
          pageHeight - 12, 
          { align: 'right' }
        );
        doc.text(
          new Date().toLocaleDateString('es-ES'), 
          margin, 
          pageHeight - 12
        );
      }
      
      // Descargar el PDF
      doc.save(`pedido_koloa_${order.id}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  /**
   * Obtiene el color del badge según el estado del pedido
   * @function getStatusBadgeColor
   * @param {string} status - Estado del pedido
   * @returns {string} Clases CSS para el badge
   */
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Traduce el estado del pedido al español
   * @function getStatusText
   * @param {string} status - Estado del pedido en inglés
   * @returns {string} Estado traducido al español
   */
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'partial':
        return 'Parcial';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading && orders.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <main className="container mx-auto px-4 py-4 sm:py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Gestión de Pedidos</h1>
          <p className="text-gray-300 mt-1 text-sm sm:text-base">
            Historial y seguimiento de pedidos de reposición
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4">
          <div className="text-sm text-gray-300">
            Total: {filteredOrders.length} pedidos
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {[
            { key: 'all', label: 'Todos', count: Array.isArray(orders) ? orders.length : 0 },
            { key: 'pending', label: 'Pendientes', count: Array.isArray(orders) ? orders.filter(o => o.status === 'pending').length : 0 },
            { key: 'partial', label: 'Parciales', count: Array.isArray(orders) ? orders.filter(o => o.status === 'partial').length : 0 },
            { key: 'completed', label: 'Completados', count: Array.isArray(orders) ? orders.filter(o => o.status === 'completed').length : 0 },
            { key: 'cancelled', label: 'Cancelados', count: Array.isArray(orders) ? orders.filter(o => o.status === 'cancelled').length : 0 }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors flex items-center text-sm sm:text-base ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="truncate">{filterOption.label}</span>
              <span className="ml-1 sm:ml-2 bg-gray-600 px-1.5 py-0.5 sm:px-2 rounded-full text-xs flex-shrink-0">
                {filterOption.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg">No hay pedidos que mostrar</p>
            <p className="text-sm mt-2">
              {filter === 'all' 
                ? 'Aún no se han creado pedidos en el sistema.'
                : `No hay pedidos con estado "${getStatusText(filter).toLowerCase()}".`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Tipo/Marca
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {order.orderNumber}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          por {order.user.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-white">
                        {order.type === 'general' ? 'General' : `Marca: ${order.brand}`}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                      {order.totalItems} unidades
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                      {order.totalPrice.toFixed(2)}€
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">
                      <div>{new Date(order.createdAt).toLocaleDateString('es-ES')}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString('es-ES')}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="text-blue-400 hover:text-blue-300 transition-colors text-lg sm:text-base"
                          title="Ver detalles"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleGeneratePDF(order)}
                          className="text-purple-400 hover:text-purple-300 transition-colors text-lg sm:text-base"
                          title="Generar PDF"
                        >
                          📄
                        </button>
                        {(order.status === 'pending' || order.status === 'partial') && (
                          <>
                            <button
                              onClick={() => handleConfirmOrder(order)}
                              className="text-green-400 hover:text-green-300 transition-colors text-lg sm:text-base"
                              title="Confirmar recepción completa"
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order)}
                              className="text-red-400 hover:text-red-300 transition-colors text-lg sm:text-base"
                              title="Cancelar pedido"
                            >
                              ❌
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
          onRefresh={async () => {
            await fetchOrders();
            if (refreshInventory) {
              await refreshInventory();
            }
            // Refrescar el pedido seleccionado
            try {
              const updatedOrder = await ordersAPI.getById(selectedOrder.id);
              setSelectedOrder(updatedOrder);
            } catch (error) {
              console.error('Error refrescando pedido:', error);
            }
          }}
        />
      )}

      {/* Modal de Confirmación */}
      {showConfirmModal && confirmingOrder && (
        <ConfirmOrderModal
          order={confirmingOrder}
          notes={confirmNotes}
          onNotesChange={setConfirmNotes}
          onConfirm={executeConfirmation}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmingOrder(null);
            setConfirmNotes('');
          }}
          loading={loading}
        />
      )}
    </main>
  );
};

/**
 * Modal para mostrar los detalles completos de un pedido
 * @function OrderDetailModal
 * @param {Object} props - Props del componente
 * @param {Object} props.order - Pedido a mostrar
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onRefresh - Función para refrescar datos
 * @returns {JSX.Element} Modal con detalles del pedido
 */
const OrderDetailModal = ({ order, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [receivingItem, setReceivingItem] = useState(null);
  const [receiveQuantity, setReceiveQuantity] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

  /**
   * Inicia el proceso de recepción de un item
   * @function handleReceiveItem
   * @param {Object} item - Item a recepcionar
   * @returns {void} No retorna valor
   */
  const handleReceiveItem = (item) => {
    setReceivingItem(item);
    setReceiveQuantity('');
    setReceiveNotes('');
  };

  /**
   * Ejecuta la recepción del item
   * @function executeReceiveItem
   * @async
   * @returns {Promise<void>} No retorna valor
   */
  const executeReceiveItem = async () => {
    try {
      setLoading(true);
      const quantity = parseInt(receiveQuantity);
      
      if (!quantity || quantity <= 0) {
        alert('Ingresa una cantidad válida');
        return;
      }

      const maxQuantity = receivingItem.quantityOrdered - receivingItem.quantityReceived;
      if (quantity > maxQuantity) {
        alert(`No puedes recepcionar más de ${maxQuantity} unidades`);
        return;
      }

      const result = await ordersAPI.receiveItem(order.id, receivingItem.id, {
        quantityReceived: quantity,
        notes: receiveNotes
      });

      alert(`Item recepcionado exitosamente. Stock actualizado: +${quantity} unidades`);
      
      // Cerrar modal de recepción
      setReceivingItem(null);
      setReceiveQuantity('');
      setReceiveNotes('');
      
      // Refrescar datos
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      alert(`Error recepcionando item: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene el color del badge según el estado del item
   * @function getItemStatusColor
   * @param {string} status - Estado del item
   * @returns {string} Clases CSS para el badge
   */
  const getItemStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Traduce el estado del item al español
   * @function getItemStatusText
   * @param {string} status - Estado del item en inglés
   * @returns {string} Estado traducido al español
   */
  const getItemStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'partial':
        return 'Parcial';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Detalles del Pedido {order.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Información General</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Número:</span>
                  <span className="text-white">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tipo:</span>
                  <span className="text-white">
                    {order.type === 'general' ? 'General' : `Marca: ${order.brand}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Creado por:</span>
                  <span className="text-white">{order.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estado:</span>
                  <span className="text-white">{order.status === 'pending' ? 'Pendiente' : order.status === 'completed' ? 'Completado' : 'Cancelado'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Totales</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Items:</span>
                  <span className="text-white">{order.totalItems} unidades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Precio Total:</span>
                  <span className="text-white">{order.totalPrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fecha Creación:</span>
                  <span className="text-white">
                    {new Date(order.createdAt).toLocaleString('es-ES')}
                  </span>
                </div>
                {order.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fecha Completado:</span>
                    <span className="text-white">
                      {new Date(order.completedAt).toLocaleString('es-ES')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items del Pedido */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Productos del Pedido</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 text-gray-400">Producto</th>
                    <th className="text-center py-2 text-gray-400">Marca</th>
                    <th className="text-center py-2 text-gray-400">Peso</th>
                    <th className="text-center py-2 text-gray-400">Pedido</th>
                    <th className="text-center py-2 text-gray-400">Recibido</th>
                    <th className="text-center py-2 text-gray-400">Estado</th>
                    <th className="text-right py-2 text-gray-400">Precio Unit.</th>
                    <th className="text-right py-2 text-gray-400">Subtotal</th>
                    {(order.status === 'pending' || order.status === 'partial') && (
                      <th className="text-center py-2 text-gray-400">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => {
                    const pendingQuantity = (item.quantityOrdered || 0) - (item.quantityReceived || 0);
                    return (
                      <tr key={item.id} className="border-b border-gray-800">
                        <td className="py-2 text-white">{item.inventoryItem.nombre}</td>
                        <td className="text-center py-2 text-gray-300">{item.inventoryItem.marca}</td>
                        <td className="text-center py-2 text-gray-300">{item.inventoryItem.peso}g</td>
                        <td className="text-center py-2 text-yellow-400">{item.quantityOrdered || 0}</td>
                        <td className="text-center py-2 text-green-400">{item.quantityReceived || 0}</td>
                        <td className="text-center py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getItemStatusColor(item.status || 'pending')}`}>
                            {getItemStatusText(item.status || 'pending')}
                          </span>
                        </td>
                        <td className="text-right py-2 text-gray-300">{item.priceAtTime.toFixed(2)}€</td>
                        <td className="text-right py-2 text-green-400">
                          {((item.quantityOrdered || 0) * item.priceAtTime).toFixed(2)}€
                        </td>
                        {(order.status === 'pending' || order.status === 'partial') && (
                          <td className="text-center py-2">
                            {pendingQuantity > 0 ? (
                              <button
                                onClick={() => handleReceiveItem(item)}
                                className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
                                title={`Recepcionar (pendiente: ${pendingQuantity})`}
                              >
                                📦 Recepcionar
                              </button>
                            ) : (
                              <span className="text-gray-500 text-xs">✅ Completo</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notas */}
          {order.notes && (
            <div className="bg-gray-900 rounded-lg p-4 mt-6">
              <h3 className="text-lg font-medium text-white mb-3">Notas</h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal de Recepción de Item */}
      {receivingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white">
                Recepcionar Item
              </h3>
              <p className="text-gray-300 mt-1">
                {receivingItem.inventoryItem.nombre} ({receivingItem.inventoryItem.marca})
              </p>
            </div>

            <div className="p-6">
              <div className="bg-gray-900 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-400 mb-1">Información del item:</div>
                <div className="text-white text-sm space-y-1">
                  <div>Cantidad pedida: {receivingItem.quantityOrdered}</div>
                  <div>Ya recibido: {receivingItem.quantityReceived || 0}</div>
                  <div className="text-yellow-400">
                    Pendiente: {(receivingItem.quantityOrdered || 0) - (receivingItem.quantityReceived || 0)}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad a recepcionar:
                </label>
                <input
                  type="number"
                  min="1"
                  max={(receivingItem.quantityOrdered || 0) - (receivingItem.quantityReceived || 0)}
                  value={receiveQuantity}
                  onChange={(e) => setReceiveQuantity(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cantidad recibida"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notas (opcional):
                </label>
                <textarea
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  placeholder="Ej: Estado del producto, fecha de caducidad..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setReceivingItem(null)}
                disabled={loading}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={executeReceiveItem}
                disabled={loading || !receiveQuantity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recepcionando...
                  </>
                ) : (
                  'Recepcionar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Modal para confirmar la recepción de un pedido
 * @function ConfirmOrderModal
 * @param {Object} props - Props del componente
 * @param {Object} props.order - Pedido a confirmar
 * @param {string} props.notes - Notas de confirmación
 * @param {Function} props.onNotesChange - Función para cambiar las notas
 * @param {Function} props.onConfirm - Función para confirmar el pedido
 * @param {Function} props.onCancel - Función para cancelar la confirmación
 * @param {boolean} props.loading - Estado de carga
 * @returns {JSX.Element} Modal de confirmación
 */
const ConfirmOrderModal = ({ order, notes, onNotesChange, onConfirm, onCancel, loading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Confirmar Recepción
          </h2>
          <p className="text-gray-300 mt-1">
            Pedido: {order.orderNumber}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-4">
              ¿Confirmas que has recibido este pedido? El stock se actualizará automáticamente.
            </p>
            <div className="bg-gray-900 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-400 mb-1">Resumen del pedido:</div>
              <div className="text-white">
                <div>{order.totalItems} unidades totales</div>
                <div>{order.totalPrice.toFixed(2)}€ valor estimado</div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notas de recepción (opcional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Ej: Todo correcto, algunos productos con fecha próxima..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Confirmando...
              </>
            ) : (
              'Confirmar Recepción'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;