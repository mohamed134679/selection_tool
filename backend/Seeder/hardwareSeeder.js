const Hardware = require('../schemas/hardware_schema');
const Io = require('../schemas/IO_schema');

async function seedHardware() {
    try {
        const count = await Hardware.countDocuments();

        if (count === 0) {
            const ioDocs = await Io.find();
            const ioIdByName = {};
            ioDocs.forEach((io) => {
                ioIdByName[io.Name] = io._id;
            });

            // IO compatibility per the notes — TM3, Edge IO, X80.
            // Harmony P6 and M262 intentionally left without compatible_io for now.
            const softDpacFamilyIo = [ioIdByName['TM3'], ioIdByName['Edge IO'],ioIdByName['X80']].filter(Boolean);
            const m251Io = [ioIdByName['TM3']].filter(Boolean);
            const m580Io = [ioIdByName['Edge IO'], ioIdByName['X80']].filter(Boolean);

            const hardwareList = [
                // SoftdPAC
                {
                    Name: 'Harmony P6',
                    type: 'SoftdPAC',
                    description: 'Industrial workstation hosting SoftdPAC and EAE HMI services on the same CPU.',
                    tags: ['Control + Visualization consolidation', 'Local operator stations'],
                    compatible_io: softDpacFamilyIo
                },
                {
                    Name: 'Modicon M590',
                    type: 'SoftdPAC',
                    description: 'Linux-based controller supporting SoftdPAC deployment.',
                    tags: ['Deterministic control', 'Dedicated controller architecture', 'Linux-based operation'],
                    compatible_io: softDpacFamilyIo
                },
                {
                    Name: 'Harmony PSA',
                    type: 'SoftdPAC',
                    description: 'Industrial IPC capable of hosting SoftdPAC runtimes.',
                    tags: ['Edge control applications', 'Compact architectures'],
                    compatible_io: softDpacFamilyIo
                },
                {
                    Name: 'Essential Edge Box',
                    type: 'SoftdPAC',
                    description: 'Industrial edge computing platform suitable for EAE deployments.',
                    tags: ['IT/OT convergence', 'Edge computing'],
                    compatible_io: softDpacFamilyIo
                },
                // IEC61499
                {
                    Name: 'M251dPac',
                    type: 'IEC61499',
                    description: 'Entry-level dedicated controller for compact machines and small automation architectures.',
                    tags: ['Machine-level control', 'Compact footprint'],
                    compatible_io: m251Io
                },
                {
                    Name: 'M580dPac',
                    type: 'IEC61499',
                    description: 'High-performance dedicated controller for demanding process and hybrid automation architectures.',
                    tags: ['High-performance control', 'Process & hybrid automation'],
                    compatible_io: m580Io
                },

                // Third Party
                {
                    Name: '3rd Party',
                    type: '3rd Party',
                    description: 'Third-party IPC hardware (ASRock Industrial / Dell / Advantech / Beckhoff IPC / customer IPC) meeting supported OS, CPU, RAM and storage requirements.',
                    tags: ['Customer-supplied hardware']
                }
            ];

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
