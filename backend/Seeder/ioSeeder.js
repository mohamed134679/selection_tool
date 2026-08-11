const Io = require('../schemas/IO_schema');

const ioList = [
    {
        Name: 'X80',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRu8jdFG2pHsnD6j9-WVmRX9TTn3cbV1Y1zHMg7y4i21w&s=10'
    },
    {
        Name: 'TM3',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRckGXElDUACZiVvebOIjWLyrKzldsh1iqBSGqrXPNlIw&s=10'
    },
    {
        Name: 'Edge IO',
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnontPlhZ8UbxJDn8ye9gWAJgzy3htMH4FOWn95MiP6A&s=10'
    }
];

async function seedIo() {
    try {
        const count = await Io.countDocuments();

        if (count === 0) {
            await Io.insertMany(ioList);
            console.log('IO seeded successfully');
        } else {
            console.log('IO collection already contains data');
        }
    } catch (err) {
        console.error(err);
    }
}

module.exports = seedIo;
