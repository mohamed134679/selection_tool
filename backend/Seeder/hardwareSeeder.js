const Hardware = require('../schemas/hardware_schema');

const hardwareList = [
    // SoftdPAC
    {
        Name: 'Harmony P6',
        type: 'SoftdPAC',
        description: 'Industrial workstation hosting SoftdPAC and EAE HMI services on the same CPU.',
        tags: ['Control + Visualization consolidation', 'Local operator stations']
    },
    {
        Name: 'Modicon M590',
        type: 'SoftdPAC',
        description: 'Linux-based controller supporting SoftdPAC deployment.',
        tags: ['Deterministic control', 'Dedicated controller architecture', 'Linux-based operation']
    },
    {
        Name: 'Harmony PSA',
        type: 'SoftdPAC',
        description: 'Industrial IPC capable of hosting SoftdPAC runtimes.',
        tags: ['Edge control applications', 'Compact architectures']
    },
    {
        Name: 'Essential Edge Box',
        type: 'SoftdPAC',
        description: 'Industrial edge computing platform suitable for EAE deployments.',
        tags: ['IT/OT convergence', 'Edge computing']
    },
    // IEC61499
    {
        Name: 'M251dPac',
        type: 'IEC61499',
        description: 'Entry-level dedicated controller for compact machines and small automation architectures.',
        tags: ['Machine-level control', 'Compact footprint']
    },
    {
        Name: 'M580dPac',
        type: 'IEC61499',
        description: 'High-performance dedicated controller for demanding process and hybrid automation architectures.',
        tags: ['High-performance control', 'Process & hybrid automation']
    },

    // Third Party
    {
        Name: '3rd Party',
        type: '3rd Party',
        description: 'Third-party IPC hardware (ASRock Industrial / Dell / Advantech / Beckhoff IPC / customer IPC) meeting supported OS, CPU, RAM and storage requirements.',
        tags: ['Customer-supplied hardware']
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