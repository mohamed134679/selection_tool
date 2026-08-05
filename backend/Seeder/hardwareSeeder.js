const Hardware = require('../schemas/hardware_schema');

const hardwareList = [
    // SoftdPAC
    {
        Name: 'Harmony P6',
        type: 'SoftdPAC'
    },
    {
        Name: 'Modicon M590',
        type: 'SoftdPAC'
    },
    {
        Name: 'Harmony PSA Essential Edge Box',
        type: 'SoftdPAC'
    },

    // IEC61499
    {
        Name: 'M251dPac',
        type: 'IEC61499'
    },
    {
        Name: 'M580dPac',
        type: 'IEC61499'
    },

    // Third Party
    {
        Name: '3rd Party',
        type: '3rd Party'
    }
];

async function seedHardware() {
    try {
        const count = await Hardware.countDocuments();

        if (count === 0) {
            await Hardware.insertMany(hardwareList);
            console.log('Hardware seeded successfully');
        } else {
            console.log('Hardware collection already contains data');
        }
    } catch (err) {
        console.error(err);
    }
}

module.exports = seedHardware;