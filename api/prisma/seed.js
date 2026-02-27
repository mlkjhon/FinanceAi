const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIAS_GLOBAIS = [
    { nome: 'Alimentação', tipo: 'gasto' },
    { nome: 'Moradia', tipo: 'gasto' },
    { nome: 'Transporte', tipo: 'gasto' },
    { nome: 'Saúde', tipo: 'gasto' },
    { nome: 'Educação', tipo: 'gasto' },
    { nome: 'Lazer', tipo: 'gasto' },
    { nome: 'Roupas', tipo: 'gasto' },
    { nome: 'Tecnologia', tipo: 'gasto' },
    { nome: 'Assinatura', tipo: 'gasto' },
    { nome: 'Renda', tipo: 'ganho' },
    { nome: 'Investimento', tipo: 'ganho' },
    { nome: 'Outros', tipo: 'gasto' },
];

async function main() {
    console.log('🌱 Semeando categorias globais...');
    for (const cat of CATEGORIAS_GLOBAIS) {
        const existing = await prisma.category.findFirst({
            where: { nome: cat.nome, userId: null }
        });

        if (!existing) {
            await prisma.category.create({
                data: {
                    nome: cat.nome,
                    tipo: cat.tipo,
                    isGlobal: true
                }
            });
            console.log(`+ Categoria: ${cat.nome}`);
        }
    }
    console.log('✅ Categorias semeadas com sucesso!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
