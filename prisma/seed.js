import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const ADMIN_PIN = process.env.ADMIN_PIN;

const prisma = new PrismaClient();

/**
 * Función principal que inicializa la base de datos con datos de prueba
 * @function main
 * @async
 * @returns {Promise<void>} No retorna valor
 * @description Limpia la base de datos, crea el usuario administrador
 * y puebla el inventario con 164 productos reales de tabacos de cachimba
 * del pub Koloa, incluyendo marcas como MUSTHAVE, BLACKBURN, DOZAJ, etc.
 */
async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.inventoryItem.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🗑️ Datos anteriores eliminados');

  // Crear usuario administrador
  const adminUser = await prisma.user.upsert({
    where: { code: ADMIN_PIN },
    update: {},
    create: {
      name: 'Administrador',
      code: ADMIN_PIN,
      failedAttempts: 0,
      blocked: false,
    },
  });

  console.log('👤 Usuario administrador creado:', adminUser);

  // Datos del inventario de Koloa
  const productos = [
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'MILRIC', peso: 200, stock: 1, minStock: 1, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'KOKO DREAM', peso: 200, stock: 0, minStock: 1, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'VIOLET', peso: 200, stock: 0, minStock: 1, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'APL DROPS', peso: 200, stock: 0, minStock: 1, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'STRAW LYCH', peso: 200, stock: 0, minStock: 1, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'ECLIPSE', peso: 200, stock: 0, minStock: 0, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'SPACE INVADERS', peso: 200, stock: 1, minStock: 1, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'KENDI CO', peso: 200, stock: 0, minStock: 1, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'STELLAR', peso: 200, stock: 1, minStock: 2, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'MOROCCO', peso: 200, stock: 0, minStock: 2, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'COSMOS', peso: 200, stock: 0, minStock: 2, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'SPACE FLY', peso: 200, stock: 1, minStock: 1, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'PINKMAN', peso: 200, stock: 0, minStock: 4, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'RASPI', peso: 200, stock: 0, minStock: 2, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'BERRY HALLS', peso: 200, stock: 0, minStock: 1, precio: 32.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'PLMBIR', peso: 125, stock: 0, minStock: 1, precio: 22.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'ORNJ TEAM', peso: 125, stock: 0, minStock: 1, precio: 22.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'GAP FUT', peso: 125, stock: 0, minStock: 1, precio: 22.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'SEA BACKTRN TI', peso: 125, stock: 0, minStock: 1, precio: 22.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'PARAPAP', peso: 125, stock: 0, minStock: 1, precio: 22.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'CHISI PI', peso: 125, stock: 0, minStock: 1, precio: 22.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'DJUMNGO', peso: 125, stock: 0, minStock: 1, precio: 22.50},
    {tipo: 'Tabaco', marca: 'MUSTHAVE', nombre: 'EXOTIC PUM', peso: 125, stock: 0, minStock: 1, precio: 22.50},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'RASERRY', peso: 100, stock: 0, minStock: 2, precio: 15.95},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'NA CHILLE', peso: 100, stock: 0, minStock: 2, precio: 15.95},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'BAPAI DINNER', peso: 100, stock: 1, minStock: 2, precio: 15.95},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'HARIBON', peso: 100, stock: 0, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'ANNAN SHOCK', peso: 100, stock: 0, minStock: 0, precio: 15.95},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'GREEN T', peso: 100, stock: 0, minStock: 4, precio: 15.95},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'EPIC GURÚ', peso: 100, stock: 0, minStock: 4, precio: 15.95},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'VALLAS LAS', peso: 100, stock: 0, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'REAL PF', peso: 100, stock: 0, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'LEMON SHOCK', peso: 100, stock: 2, minStock: 4, precio: 15.95},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'KRAM SHOCK', peso: 100, stock: 1, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'BLACKBURN', nombre: 'MALIBU', peso: 100, stock: 0, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'NAW', nombre: 'GREEN HEART', peso: 100, stock: 1, minStock: 2, precio: 15.95},
    {tipo: 'Tabaco', marca: 'NAW', nombre: 'BRAVO', peso: 100, stock: 0, minStock: 2, precio: 15.95},
    {tipo: 'Tabaco', marca: 'NAW', nombre: 'HOLA CARMENCITA', peso: 100, stock: 2, minStock: 3, precio: 15.95},
    {tipo: 'Tabaco', marca: 'NAW', nombre: 'JUBILEE', peso: 100, stock: 0, minStock: 2, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DUMANJI', nombre: 'GALACTIC', peso: 200, stock: 1, minStock: 2, precio: 16.50},
    {tipo: 'Tabaco', marca: 'AL WAHA', nombre: 'MASALA', peso: 200, stock: 0, minStock: 1, precio: 15.50},
    {tipo: 'Tabaco', marca: 'AL WAHA', nombre: 'BIG BOY', peso: 200, stock: 2, minStock: 2, precio: 15.50},
    {tipo: 'Tabaco', marca: 'AL WAHA', nombre: 'CASPER', peso: 200, stock: 0, minStock: 1, precio: 15.50},
    {tipo: 'Tabaco', marca: 'PRIVILEGE', nombre: 'FIGHT', peso: 200, stock: 0, minStock: 2, precio: 15.50},
    {tipo: 'Tabaco', marca: 'PRIVILEGE', nombre: 'DIVE', peso: 200, stock: 0, minStock: 2, precio: 15.50},
    {tipo: 'Tabaco', marca: 'AQM', nombre: 'GOLDEN ANNA', peso: 50, stock: 0, minStock: 10, precio: 3.50},
    {tipo: 'Tabaco', marca: 'OS TABACO', nombre: 'BONNIE AND CLYDE', peso: 200, stock: 0, minStock: 2, precio: 17.50},
    {tipo: 'Tabaco', marca: 'OS TABACO', nombre: 'UNKNOWN', peso: 50, stock: 1, minStock: 3, precio: 4.50},
    {tipo: 'Tabaco', marca: 'OS TABACO', nombre: 'AFRICAN QUEEN', peso: 50, stock: 2, minStock: 0, precio: 4.50},
    {tipo: 'Tabaco', marca: 'HOLSTER', nombre: 'WINTER EDITION', peso: 200, stock: 1, minStock: 4, precio: 18.95},
    {tipo: 'Tabaco', marca: 'HOLSTER', nombre: 'IZ KAKTUZ', peso: 200, stock: 4, minStock: 4, precio: 18.95},
    {tipo: 'Tabaco', marca: 'HOLSTER', nombre: 'BLOODY PUNCH', peso: 200, stock: 0, minStock: 4, precio: 18.95},
    {tipo: 'Tabaco', marca: 'HOLSTER', nombre: 'QUIMI PUNCH', peso: 200, stock: 1, minStock: 3, precio: 18.95},
    {tipo: 'Tabaco', marca: 'HOLSTER', nombre: 'MISS JOSSY', peso: 200, stock: 1, minStock: 2, precio: 18.95},
    {tipo: 'Tabaco', marca: 'HOLSTER', nombre: 'IZ BOMB', peso: 200, stock: 0, minStock: 1, precio: 18.95},
    {tipo: 'Tabaco', marca: 'HOLSTER', nombre: 'LEE PUNCH', peso: 200, stock: 0, minStock: 1, precio: 18.95},
    {tipo: 'Tabaco', marca: 'STREETSMOKE', nombre: 'ARTIC PRINCE', peso: 200, stock: 7, minStock: 7, precio: 17.50},
    {tipo: 'Tabaco', marca: 'STREETSMOKE', nombre: 'MIC DROP', peso: 200, stock: 4, minStock: 4, precio: 17.50},
    {tipo: 'Tabaco', marca: 'STREETSMOKE', nombre: 'HABIBO', peso: 200, stock: 0, minStock: 7, precio: 17.50},
    {tipo: 'Tabaco', marca: 'STREETSMOKE', nombre: 'BARISTA', peso: 200, stock: 1, minStock: 2, precio: 17.50},
    {tipo: 'Tabaco', marca: 'STREETSMOKE', nombre: 'BEACH WITH A P', peso: 200, stock: 0, minStock: 2, precio: 17.50},
    {tipo: 'Tabaco', marca: 'STREETSMOKE', nombre: 'THE BOSS', peso: 200, stock: 0, minStock: 3, precio: 17.50},
    {tipo: 'Tabaco', marca: 'HOOKAIN', nombre: 'DUBAI', peso: 200, stock: 0, minStock: 1, precio: 14.00},
    {tipo: 'Tabaco', marca: 'HOOKAIN', nombre: 'BLOWTUS', peso: 200, stock: 0, minStock: 3, precio: 14.00},
    {tipo: 'Tabaco', marca: 'HOOKAIN', nombre: 'KAFFAYAYO', peso: 200, stock: 8, minStock: 7, precio: 14.00},
    {tipo: 'Tabaco', marca: 'HOOKAIN', nombre: 'WHITE CAEK', peso: 200, stock: 5, minStock: 4, precio: 14.00},
    {tipo: 'Tabaco', marca: 'HOOKAIN', nombre: 'ALMAN', peso: 200, stock: 0, minStock: 3, precio: 14.00},
    {tipo: 'Tabaco', marca: 'HOOKAIN BLACK', nombre: 'KAFFAYAYO', peso: 200, stock: 1, minStock: 1, precio: 18.50},
    {tipo: 'Tabaco', marca: 'HAZE', nombre: 'SINFUL', peso: 200, stock: 2, minStock: 1, precio: 17.50},
    {tipo: 'Tabaco', marca: 'HAZE', nombre: 'SUBZERO', peso: 200, stock: 2, minStock: 1, precio: 17.50},
    {tipo: 'Tabaco', marca: 'HAZE', nombre: 'PURPLE KRUSH', peso: 200, stock: 0, minStock: 1, precio: 17.50},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'CARNIVAL', peso: 200, stock: 0, minStock: 2, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'TOKYO', peso: 200, stock: 5, minStock: 2, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'UFF', peso: 200, stock: 5, minStock: 5, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'BUM BUM', peso: 200, stock: 0, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'HURACAN', peso: 200, stock: 0, minStock: 4, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'ETERNAL', peso: 200, stock: 0, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'EUPHORIA', peso: 200, stock: 1, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'NAIROBI', peso: 200, stock: 1, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'LÍO', peso: 200, stock: 0, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'BERGA', peso: 50, stock: 1, minStock: 1, precio: 4.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'JOE QUE FRIO', peso: 200, stock: 1, minStock: 2, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'EXPLOSION', peso: 200, stock: 2, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'PRIME', peso: 200, stock: 2, minStock: 0, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'PARADOX', peso: 50, stock: 2, minStock: 0, precio: 4.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'INFINITY', peso: 50, stock: 1, minStock: 0, precio: 4.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'SUKA', peso: 50, stock: 1, minStock: 0, precio: 4.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'BLAST', peso: 50, stock: 1, minStock: 0, precio: 4.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'TERRY MISS YOU', peso: 50, stock: 1, minStock: 0, precio: 4.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'MAX', peso: 50, stock: 1, minStock: 0, precio: 4.95},
    {tipo: 'Tabaco', marca: 'DOZAJ', nombre: 'OLD SCHOOL', peso: 200, stock: 2, minStock: 3, precio: 15.95},
    {tipo: 'Tabaco', marca: 'DUFT', nombre: 'SCOTCH SKY', peso: 100, stock: 2, minStock: 1, precio: 14.00},
    {tipo: 'Tabaco', marca: 'DUFT', nombre: 'CINNABUM', peso: 100, stock: 1, minStock: 1, precio: 14.00},
    {tipo: 'Tabaco', marca: 'DUFT', nombre: 'JIN GR CUKKI', peso: 100, stock: 1, minStock: 1, precio: 14.00},
    {tipo: 'Tabaco', marca: 'DUFT', nombre: 'ROOT BEAR', peso: 100, stock: 1, minStock: 1, precio: 14.00},
    {tipo: 'Tabaco', marca: 'DUFT', nombre: 'PANAPP', peso: 100, stock: 2, minStock: 2, precio: 14.00},
    {tipo: 'Tabaco', marca: 'DUFT', nombre: 'PAN MASALA', peso: 100, stock: 0, minStock: 1, precio: 14.00},
    {tipo: 'Tabaco', marca: 'DUFT', nombre: 'T.MISSUE', peso: 100, stock: 1, minStock: 1, precio: 14.00},
    {tipo: 'Tabaco', marca: 'KISMET', nombre: 'BLACK ANGEL', peso: 200, stock: 0, minStock: 2, precio: 21.50},
    {tipo: 'Tabaco', marca: 'KISMET', nombre: 'BLACK ROSE', peso: 200, stock: 1, minStock: 1, precio: 21.50},
    {tipo: 'Tabaco', marca: 'KISMET', nombre: 'BLACK MAIA', peso: 200, stock: 1, minStock: 2, precio: 21.50},
    {tipo: 'Tabaco', marca: 'KISMET', nombre: 'BLACK WOOD', peso: 200, stock: 2, minStock: 1, precio: 21.50},
    {tipo: 'Tabaco', marca: 'KISMET', nombre: 'BLACK GREENLIGHT', peso: 200, stock: 2, minStock: 0, precio: 21.50},
    {tipo: 'Tabaco', marca: 'BLUE HORSE', nombre: 'MI AMOR', peso: 200, stock: 2, minStock: 2, precio: 14.00},
    {tipo: 'Tabaco', marca: 'ADALYA', nombre: 'LADY KILLER', peso: 50, stock: 2, minStock: 2, precio: 3.85},
    {tipo: 'Tabaco', marca: 'ADALYA', nombre: 'BLUE ISS', peso: 200, stock: 1, minStock: 2, precio: 14.00},
    {tipo: 'Tabaco', marca: 'ADALYA', nombre: 'BLUE YELLOW', peso: 200, stock: 1, minStock: 1, precio: 14.00},
    {tipo: 'Tabaco', marca: 'ADALYA', nombre: 'MOONDREAM', peso: 200, stock: 1, minStock: 1, precio: 14.00},
    {tipo: 'Tabaco', marca: 'ADALYA', nombre: 'HAWAII', peso: 200, stock: 0, minStock: 1, precio: 14.00},
    {tipo: 'Tabaco', marca: 'ADALYA', nombre: 'LOVE', peso: 200, stock: 5, minStock: 5, precio: 14.00},
    {tipo: 'Tabaco', marca: 'TABOO', nombre: 'SEXY GREEN', peso: 200, stock: 8, minStock: 10, precio: 15.90},
    {tipo: 'Tabaco', marca: 'TABOO', nombre: 'BRUTAL CHOICE', peso: 200, stock: 1, minStock: 1, precio: 15.90},
    {tipo: 'Tabaco', marca: 'TABOO', nombre: 'DANCING QUEEN', peso: 200, stock: 0, minStock: 2, precio: 15.90},
    {tipo: 'Tabaco', marca: 'TABOO', nombre: 'OVER THE RAIMBOW', peso: 200, stock: 1, minStock: 1, precio: 15.90},
    {tipo: 'Tabaco', marca: 'ANDA', nombre: 'BLUE TOTETA', peso: 200, stock: 1, minStock: 1, precio: 17.50},
    {tipo: 'Tabaco', marca: 'ANDA', nombre: 'TEMPTATION', peso: 200, stock: 0, minStock: 5, precio: 17.50},
    {tipo: 'Tabaco', marca: 'ANDA', nombre: 'MANDINGO', peso: 200, stock: 0, minStock: 2, precio: 17.50},
    {tipo: 'Tabaco', marca: 'ANDA', nombre: 'TIKITAKA', peso: 200, stock: 0, minStock: 4, precio: 17.50},
    {tipo: 'Tabaco', marca: 'ANDA', nombre: 'MENTIDO', peso: 200, stock: 0, minStock: 2, precio: 17.50},
    {tipo: 'Tabaco', marca: 'BLYAT', nombre: 'CONO VERDE', peso: 200, stock: 1, minStock: 0, precio: 17.50},
    {tipo: 'Tabaco', marca: 'NAMELESS', nombre: 'WINTER IS COMING', peso: 200, stock: 0, minStock: 4, precio: 18.95},
    {tipo: 'Tabaco', marca: 'NAMELESS', nombre: 'BLACK NANA', peso: 200, stock: 0, minStock: 3, precio: 18.95},
    {tipo: 'Tabaco', marca: 'NAMELESS', nombre: 'PICHES', peso: 200, stock: 0, minStock: 3, precio: 18.95},
    {tipo: 'Tabaco', marca: 'NAMELESS', nombre: 'MONKEY BRAIN', peso: 200, stock: 0, minStock: 1, precio: 18.95},
    {tipo: 'Tabaco', marca: 'NAMELESS', nombre: 'PABLO', peso: 200, stock: 0, minStock: 1, precio: 18.95},
    {tipo: 'Tabaco', marca: 'BLAZE', nombre: 'WHITE HEAVEN', peso: 200, stock: 0, minStock: 1, precio: 19.50},
    {tipo: 'Tabaco', marca: 'BLAZE', nombre: 'BATLUVA', peso: 200, stock: 0, minStock: 1, precio: 19.50},
    {tipo: 'Tabaco', marca: 'BLAZE', nombre: 'CINEMA ROLL', peso: 200, stock: 2, minStock: 1, precio: 19.50},
    {tipo: 'Tabaco', marca: 'BLAZE', nombre: 'PREACH', peso: 200, stock: 0, minStock: 0, precio: 19.50},
    {tipo: 'Tabaco', marca: 'BLAZE', nombre: 'LUV', peso: 200, stock: 0, minStock: 2, precio: 19.50},
    {tipo: 'Tabaco', marca: 'BLAZE', nombre: 'LEMENCIAGA', peso: 200, stock: 1, minStock: 2, precio: 19.50},
    {tipo: 'Tabaco', marca: 'BLAZE', nombre: 'GUAVAMENTE', peso: 200, stock: 0, minStock: 1, precio: 19.50},
    {tipo: 'Tabaco', marca: 'STARBUZZ VINTAGE', nombre: 'GREEN SAVIOR', peso: 50, stock: 1, minStock: 2, precio: 3.95},
    {tipo: 'Tabaco', marca: 'STARBUZZ VINTAGE', nombre: 'FRESHCITO', peso: 50, stock: 2, minStock: 2, precio: 3.95},
    {tipo: 'Tabaco', marca: 'STARBUZZ VINTAGE', nombre: 'DELHI T', peso: 50, stock: 1, minStock: 2, precio: 3.95},
    {tipo: 'Tabaco', marca: 'TANGIERS', nombre: '96 CANE MINT', peso: 250, stock: 1, minStock: 2, precio: 35.00},
    {tipo: 'Tabaco', marca: 'TANGIERS', nombre: '113 HIERBABUENA', peso: 250, stock: 0, minStock: 2, precio: 35.00},
    {tipo: 'Tabaco', marca: 'TANGIERS', nombre: '38 KASHMIR PEACH', peso: 250, stock: 1, minStock: 1, precio: 35.00},
    {tipo: 'Tabaco', marca: 'TANGIERS', nombre: '27 COCOA', peso: 250, stock: 1, minStock: 0, precio: 35.00},
    {tipo: 'Tabaco', marca: 'TANGIERS', nombre: '34 CEREALES AMERICANOS', peso: 250, stock: 2, minStock: 0, precio: 35.00},
    {tipo: 'Tabaco', marca: 'TANGIERS', nombre: '78 HORCHATA', peso: 250, stock: 2, minStock: 0, precio: 35.00},
    {tipo: 'Tabaco', marca: 'TANGIERS', nombre: '58 CREMA DE WHISKY', peso: 250, stock: 2, minStock: 0, precio: 35.00},
    {tipo: 'Tabaco', marca: 'REVOSHI', nombre: 'VAINA', peso: 200, stock: 1, minStock: 0, precio: 15.95},
    {tipo: 'Tabaco', marca: 'REVOSHI', nombre: 'ROPE A DOPE', peso: 200, stock: 1, minStock: 0, precio: 18.00},
    {tipo: 'Tabaco', marca: 'REVOSHI', nombre: 'CAPITAN PINTO', peso: 200, stock: 1, minStock: 0, precio: 15.95},
    {tipo: 'Tabaco', marca: 'REVOSHI', nombre: 'FLOAT LIKE BUTTERFLY', peso: 200, stock: 1, minStock: 0, precio: 18.00},
    {tipo: 'Tabaco', marca: 'REVOSHI', nombre: 'LAZY SUNDAY', peso: 200, stock: 0, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'REVOSHI', nombre: 'ANNIBAL FANG', peso: 200, stock: 1, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'REVOSHI', nombre: 'KAK DELA TRSHKV', peso: 200, stock: 1, minStock: 1, precio: 15.95},
    {tipo: 'Tabaco', marca: 'MR SHISHA', nombre: 'JHEEZ', peso: 200, stock: 1, minStock: 1, precio: 16.00},
    {tipo: 'Tabaco', marca: 'MR SHISHA', nombre: 'GINJA LAIM', peso: 200, stock: 0, minStock: 1, precio: 16.00},
    {tipo: 'Tabaco', marca: 'FOREVER GOLD', nombre: 'PINKMAN', peso: 200, stock: 1, minStock: 2, precio: 18.50},
    {tipo: 'Tabaco', marca: 'FOREVER GOLD', nombre: 'PIGGY BBQ (BACON)', peso: 200, stock: 2, minStock: 1, precio: 18.50},
    {tipo: 'Tabaco', marca: 'FOREVER GOLD', nombre: 'FREAK', peso: 200, stock: 2, minStock: 1, precio: 18.50},
    {tipo: 'Tabaco', marca: 'FOREVER GOLD', nombre: 'BORDER', peso: 200, stock: 2, minStock: 0, precio: 18.50},
    {tipo: 'Tabaco', marca: 'FOREVER GOLD', nombre: 'JAZZ', peso: 200, stock: 2, minStock: 0, precio: 21.40},
    {tipo: 'Tabaco', marca: 'DARKSIDE', nombre: 'SUPERNOVA', peso: 30, stock: 2, minStock: 3, precio: 3.85},
    {tipo: 'Tabaco', marca: 'DARKSIDE', nombre: 'MG ASSI', peso: 30, stock: 1, minStock: 1, precio: 3.85},
    {tipo: 'Tabaco', marca: 'DARKSIDE', nombre: 'BN PAPA', peso: 30, stock: 1, minStock: 0, precio: 3.85},
    {tipo: 'Tabaco', marca: 'DARKSIDE', nombre: 'I GRANNY', peso: 30, stock: 0, minStock: 2, precio: 3.85},
    {tipo: 'Tabaco', marca: 'AL FAKHER', nombre: 'BIG GREEN', peso: 250, stock: 1, minStock: 1, precio: 19.95},
    {tipo: 'Tabaco', marca: 'AL FAKHER', nombre: 'THE DOUBLE CRUNCH', peso: 250, stock: 2, minStock: 2, precio: 19.95},
    {tipo: 'Tabaco', marca: 'AL FAKHER', nombre: 'IVORY GOLD', peso: 100, stock: 0, minStock: 3, precio: 9.95},
    {tipo: 'Tabaco', marca: 'AL FAKHER', nombre: 'POLAR FREEZE', peso: 100, stock: 1, minStock: 0, precio: 9.95}
  ];

  let created = 0;
  for (const producto of productos) {
    const item = await prisma.inventoryItem.create({
      data: producto
    });
    created++;
    if (created % 20 === 0) {
      console.log(`📦 ${created} productos creados...`);
    }
  }

  console.log(`✅ Seed completado exitosamente! ${created} productos creados.`);
  
  // Estadísticas
  const lowStock = productos.filter(p => p.stock < p.minStock).length;
  const outOfStock = productos.filter(p => p.stock === 0).length;
  
  console.log(`📊 Estadísticas:`);
  console.log(`   - Total productos: ${created}`);
  console.log(`   - Stock bajo: ${lowStock}`);
  console.log(`   - Sin stock: ${outOfStock}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });