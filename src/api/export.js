import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.js";
import XLSX from 'xlsx';
import pkg from 'jspdf';
const { jsPDF } = pkg;
import 'jspdf-autotable';

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Middleware para verificar permisos de administrador
router.use((req, res, next) => {
	if (req.user.role !== 'admin') {
		return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de administrador." });
	}
	next();
});

/**
 * Exporta datos del inventario en formato Excel
 * @function exportInventory
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Buffer>} Archivo Excel con los datos del inventario
 * @description Genera un archivo Excel con todos los productos del inventario
 */
router.get("/inventory", async (req, res) => {
	try {
		// Obtener todos los productos del inventario
		const items = await prisma.inventoryItem.findMany({
			orderBy: [
				{ marca: 'asc' },
				{ nombre: 'asc' }
			]
		});

		if (items.length === 0) {
			return res.status(404).json({ error: "No hay productos en el inventario para exportar" });
		}

		// Preparar los datos para Excel
		const excelData = items.map(item => {
			// Determinar estado del stock
			let estadoStock = 'Normal';
			if (item.stock === 0) {
				estadoStock = 'Sin Stock';
			} else if (item.stock < item.minStock) {
				estadoStock = 'Stock Bajo';
			}

			return {
				'Marca': item.marca,
				'Nombre': item.nombre,
				'Peso': `${item.peso}g`,
				'Stock': item.stock,
				'Stock Mínimo': item.minStock,
				'Estado': estadoStock,
				'Precio': `${item.precio.toFixed(2)}€`,
				'Tipo': item.tipo,
				'Valor Total': `${(item.stock * item.precio).toFixed(2)}€`
			};
		});

		// Calcular totales
		const totalProductos = items.length;
		const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
		const valorTotalInventario = items.reduce((sum, item) => sum + (item.stock * item.precio), 0);
		const productosStockBajo = items.filter(item => item.stock < item.minStock && item.stock > 0).length;
		const productosSinStock = items.filter(item => item.stock === 0).length;

		// Agregar filas de resumen
		excelData.push({});
		excelData.push({ 'Marca': 'RESUMEN DEL INVENTARIO', 'Nombre': '', 'Peso': '', 'Stock': '', 'Stock Mínimo': '', 'Estado': '', 'Precio': '', 'Tipo': '', 'Valor Total': '' });
		excelData.push({ 'Marca': 'Total de productos:', 'Nombre': totalProductos, 'Peso': '', 'Stock': '', 'Stock Mínimo': '', 'Estado': '', 'Precio': '', 'Tipo': '', 'Valor Total': '' });
		excelData.push({ 'Marca': 'Total unidades en stock:', 'Nombre': totalStock, 'Peso': '', 'Stock': '', 'Stock Mínimo': '', 'Estado': '', 'Precio': '', 'Tipo': '', 'Valor Total': '' });
		excelData.push({ 'Marca': 'Valor total del inventario:', 'Nombre': `${valorTotalInventario.toFixed(2)}€`, 'Peso': '', 'Stock': '', 'Stock Mínimo': '', 'Estado': '', 'Precio': '', 'Tipo': '', 'Valor Total': '' });
		excelData.push({ 'Marca': 'Productos con stock bajo:', 'Nombre': productosStockBajo, 'Peso': '', 'Stock': '', 'Stock Mínimo': '', 'Estado': '', 'Precio': '', 'Tipo': '', 'Valor Total': '' });
		excelData.push({ 'Marca': 'Productos sin stock:', 'Nombre': productosSinStock, 'Peso': '', 'Stock': '', 'Stock Mínimo': '', 'Estado': '', 'Precio': '', 'Tipo': '', 'Valor Total': '' });

		// Crear libro de trabajo
		const workbook = XLSX.utils.book_new();
		const worksheet = XLSX.utils.json_to_sheet(excelData);

		// Configurar anchos de columna
		worksheet['!cols'] = [
			{ width: 20 }, // Marca
			{ width: 35 }, // Nombre
			{ width: 10 }, // Peso
			{ width: 10 }, // Stock
			{ width: 15 }, // Stock Mínimo
			{ width: 15 }, // Estado
			{ width: 12 }, // Precio
			{ width: 12 }, // Tipo
			{ width: 15 }  // Valor Total
		];

		// Agregar hoja al libro
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

		// Generar buffer del archivo
		const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		// Configurar headers para descarga
		const filename = `inventario-koloa-${new Date().toISOString().split('T')[0]}.xlsx`;
		
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.setHeader('Content-Length', buffer.length);

		res.send(buffer);
	} catch (error) {
		console.error("Error exportando inventario:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

/**
 * Exporta datos de pedidos en formato Excel con múltiples tablas
 * @function exportOrders
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Buffer>} Archivo Excel con los datos de pedidos
 * @description Genera un archivo Excel con todos los pedidos, cada uno en su propia tabla
 */
router.get("/orders", async (req, res) => {
	try {
		// Obtener todos los pedidos con sus items
		const orders = await prisma.order.findMany({
			include: {
				user: {
					select: {
						name: true
					}
				},
				items: {
					include: {
						inventoryItem: {
							select: {
								marca: true,
								nombre: true,
								peso: true
							}
						}
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		if (orders.length === 0) {
			return res.status(404).json({ error: "No hay pedidos para exportar" });
		}

		// Preparar datos para Excel
		const excelData = [];
		
		orders.forEach((order, orderIndex) => {
			// Encabezado del pedido
			excelData.push({
				'NumeroPedido': order.orderNumber,
				'Usuario': order.user.name,
				'Fecha': new Date(order.createdAt).toLocaleDateString('es-ES', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric'
				}),
				'Articulos': order.totalItems,
				'ImporteTotal': `${order.totalPrice.toFixed(2)}€`
			});

			// Detalles de los productos
			order.items.forEach((item, itemIndex) => {
				const subtotal = item.quantityOrdered * item.priceAtTime;
				excelData.push({
					'NumeroPedido': '', // Vacío para líneas de detalle
					'Usuario': '', // Vacío para líneas de detalle
					'Fecha': '', // Vacío para líneas de detalle
					'Articulos': `${item.inventoryItem.marca} - ${item.inventoryItem.nombre} (${item.inventoryItem.peso}g)`,
					'ImporteTotal': `${item.quantityOrdered} x ${item.priceAtTime.toFixed(2)}€ = ${subtotal.toFixed(2)}€`
				});
			});

			// Línea separadora entre pedidos
			if (orderIndex < orders.length - 1) {
				excelData.push({
					'NumeroPedido': '',
					'Usuario': '',
					'Fecha': '',
					'Articulos': '─────────────────────────────────────────',
					'ImporteTotal': ''
				});
			}
		});

		// Crear libro de trabajo
		const workbook = XLSX.utils.book_new();
		const worksheet = XLSX.utils.json_to_sheet(excelData);

		// Configurar anchos de columna
		worksheet['!cols'] = [
			{ width: 18 }, // NumeroPedido
			{ width: 25 }, // Usuario
			{ width: 15 }, // Fecha
			{ width: 50 }, // Articulos
			{ width: 30 }  // ImporteTotal
		];

		// Configurar estilos (headers en negrita)
		let rowIndex = 0;
		orders.forEach((order) => {
			// Estilo para el encabezado del pedido
			const headerCellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
			if (!worksheet[headerCellAddress]) worksheet[headerCellAddress] = {};
			if (!worksheet[headerCellAddress].s) worksheet[headerCellAddress].s = {};
			worksheet[headerCellAddress].s.font = { bold: true };
			
			rowIndex++; // Header row
			rowIndex += order.items.length; // Detail rows
			rowIndex++; // Separator row (if not last)
		});

		// Agregar hoja al libro
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');

		// Generar buffer del archivo
		const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

		// Configurar headers para descarga
		const filename = `pedidos-koloa-${new Date().toISOString().split('T')[0]}.xlsx`;
		
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.setHeader('Content-Length', buffer.length);

		res.send(buffer);
	} catch (error) {
		console.error("Error exportando pedidos:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

/**
 * Exporta datos del inventario en formato PDF
 * @function exportInventoryPDF
 * @async
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @returns {Promise<Buffer>} Archivo PDF con los datos del inventario
 * @description Genera un archivo PDF con todos los productos del inventario
 */
router.get("/inventory-pdf", async (req, res) => {
	try {
		// Obtener todos los productos del inventario
		const items = await prisma.inventoryItem.findMany({
			orderBy: [
				{ tipo: 'asc' },
				{ marca: 'asc' },
				{ nombre: 'asc' }
			]
		});

		if (items.length === 0) {
			return res.status(404).json({ error: "No hay productos en el inventario para exportar" });
		}

		// Crear documento PDF
		const doc = new jsPDF({
			orientation: 'landscape',
			unit: 'mm',
			format: 'a4'
		});

		// Configurar fuente y colores
		doc.setFont('helvetica');
		
		// Título del documento
		doc.setFontSize(18);
		doc.setTextColor(40, 40, 40);
		doc.text('INVENTARIO KOLOA', doc.internal.pageSize.width / 2, 15, { align: 'center' });
		
		// Información del documento
		doc.setFontSize(10);
		doc.setTextColor(100, 100, 100);
		doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 14, 25);
		doc.text(`Total de productos: ${items.length}`, 14, 30);

		// Calcular totales
		const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
		const valorTotal = items.reduce((sum, item) => sum + (item.stock * item.precio), 0);
		const sinStock = items.filter(item => item.stock === 0).length;
		const stockBajo = items.filter(item => item.stock < item.minStock && item.stock > 0).length;

		doc.text(`Total unidades: ${totalStock}`, 14, 35);
		doc.text(`Valor total: ${valorTotal.toFixed(2)}€`, 80, 35);
		doc.text(`Sin stock: ${sinStock}`, 140, 35);
		doc.text(`Stock bajo: ${stockBajo}`, 180, 35);

		// Preparar datos para la tabla
		const tableData = items.map(item => {
			let estadoStock = 'Normal';
			if (item.stock === 0) {
				estadoStock = 'Sin Stock';
			} else if (item.stock < item.minStock) {
				estadoStock = 'Stock Bajo';
			}

			return [
				item.tipo,
				item.marca,
				item.nombre,
				`${item.peso}g`,
				item.stock.toString(),
				item.minStock.toString(),
				estadoStock,
				`${item.precio.toFixed(2)}€`,
				`${(item.stock * item.precio).toFixed(2)}€`
			];
		});

		// Generar tabla con autoTable
		doc.autoTable({
			startY: 45,
			head: [['Tipo', 'Marca', 'Nombre', 'Peso', 'Stock', 'Min', 'Estado', 'Precio', 'Valor']],
			body: tableData,
			theme: 'grid',
			styles: {
				fontSize: 8,
				cellPadding: 2,
				overflow: 'linebreak'
			},
			headStyles: {
				fillColor: [41, 128, 185],
				textColor: 255,
				fontStyle: 'bold',
				halign: 'center'
			},
			columnStyles: {
				0: { cellWidth: 20, halign: 'left' },   // Tipo
				1: { cellWidth: 30, halign: 'left' },   // Marca
				2: { cellWidth: 60, halign: 'left' },   // Nombre
				3: { cellWidth: 18, halign: 'center' }, // Peso
				4: { cellWidth: 15, halign: 'center' }, // Stock
				5: { cellWidth: 15, halign: 'center' }, // Min
				6: { cellWidth: 25, halign: 'center' }, // Estado
				7: { cellWidth: 20, halign: 'right' },  // Precio
				8: { cellWidth: 25, halign: 'right' }   // Valor
			},
			alternateRowStyles: {
				fillColor: [245, 245, 245]
			},
			didParseCell: function(data) {
				// Colorear las celdas de estado según el valor
				if (data.column.index === 6) {
					const cellText = data.cell.text[0];
					if (cellText.includes('Sin Stock')) {
						data.cell.styles.textColor = [231, 76, 60]; // Rojo
						data.cell.styles.fontStyle = 'bold';
					} else if (cellText.includes('Bajo')) {
						data.cell.styles.textColor = [243, 156, 18]; // Naranja
						data.cell.styles.fontStyle = 'bold';
					} else {
						data.cell.styles.textColor = [39, 174, 96]; // Verde
					}
				}
			},
			didDrawPage: function(data) {
				// Pie de página
				const pageCount = doc.internal.getNumberOfPages();
				const pageSize = doc.internal.pageSize;
				const pageHeight = pageSize.height || pageSize.getHeight();
				
				doc.setFontSize(8);
				doc.setTextColor(150);
				doc.text(
					`Página ${doc.internal.getCurrentPageInfo().pageNumber} de ${pageCount}`,
					pageSize.width / 2,
					pageHeight - 10,
					{ align: 'center' }
				);
				doc.text(
					'Koloa Inventory System',
					14,
					pageHeight - 10
				);
			}
		});

		// Generar PDF como buffer
		const pdfOutput = doc.output('arraybuffer');
		const pdfBuffer = Buffer.from(pdfOutput);

		// Configurar headers para descarga
		const filename = `inventario-koloa-${new Date().toISOString().split('T')[0]}.pdf`;
		
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.setHeader('Content-Length', pdfBuffer.length);

		res.end(pdfBuffer, 'binary');
	} catch (error) {
		console.error("Error exportando inventario a PDF:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

export default router;