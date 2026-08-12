const Hmi = require('../schemas/Hmi_schema');

async function seedHmi() {
    try {
        const count = await Hmi.countDocuments();

        if (count === 0) {
            const hmiList = [
                // Schneider Electric Hardware
                {
                    Name: 'Harmony P6',
                    brand: 'Schneider'
                },
                {
                    Name: 'Harmony PSA',
                    brand: 'Schneider'
                },

                // Third-Party Hardware
                {
                    Name: 'Windows IPC',
                    brand: 'Third-Party'
                },
                {
                    Name: 'Linux IPC',
                    brand: 'Third-Party'
                }
            ];

            await Hmi.insertMany(hmiList);
            console.log('HMI seeded successfully');
        } else {
            console.log('HMI collection already contains data');
        }
    } catch (err) {
        console.error(err);
    }
}

module.exports = seedHmi;