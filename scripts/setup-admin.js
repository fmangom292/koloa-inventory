import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para crear un usuario administrador inicial
 * @function createInitialAdmin
 * @async
 * @returns {void} No retorna valor
 * @description Crea un usuario administrador con código 0000 si no existe
 */
async function createInitialAdmin() {
	try {
		// Verificar si ya existe un administrador
		const existingAdmin = await prisma.user.findFirst({
			where: { role: 'admin' }
		});

		if (existingAdmin) {
			console.log('✅ Ya existe un usuario administrador:', existingAdmin.name);
			return;
		}

		// Crear usuario administrador inicial
		const admin = await prisma.user.create({
			data: {
				name: 'Administrador',
				code: '0000',
				role: 'admin'
			}
		});

		console.log('✅ Usuario administrador creado exitosamente:');
		console.log(`   - Nombre: ${admin.name}`);
		console.log(`   - Código: ${admin.code}`);
		console.log(`   - Rol: ${admin.role}`);
		console.log('\n🔑 Utiliza el código 0000 para acceder como administrador');

	} catch (error) {
		console.error('❌ Error creando usuario administrador:', error);
	} finally {
		await prisma.$disconnect();
	}
}

/**
 * Script para actualizar usuarios existentes y asignarles el rol por defecto
 * @function updateExistingUsers
 * @async
 * @returns {void} No retorna valor
 * @description Actualiza usuarios existentes que no tienen rol asignado
 */
async function updateExistingUsers() {
	try {
		// Actualizar usuarios que no tienen rol (por la migración)
		const updatedUsers = await prisma.user.updateMany({
			where: {
				role: {
					in: [null, '']
				}
			},
			data: {
				role: 'user'
			}
		});

		if (updatedUsers.count > 0) {
			console.log(`✅ ${updatedUsers.count} usuario(s) actualizado(s) con rol 'user'`);
		}

	} catch (error) {
		console.error('❌ Error actualizando usuarios existentes:', error);
	}
}

// Ejecutar scripts
async function main() {
	console.log('🚀 Configurando sistema de administración...\n');
	
	await updateExistingUsers();
	await createInitialAdmin();
	
	console.log('\n✨ Configuración completada!');
}

main();