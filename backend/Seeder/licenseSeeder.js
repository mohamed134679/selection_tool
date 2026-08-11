const License = require('../schemas/License_schema');

const licenses = [
  // Engineering Licenses
  {
    name: "Standard Engineering License",
    reference_no: "EALBTC",
    description: "EcoStruxure Automation Expert - Standard Engineering license",
  },
  {
    name: "Professional Engineering License",
    reference_no: "EALBFC",
    description: "EcoStruxure Automation Expert - Professional Engineering license",
  },

  // Engineering Add-ons
  {
    name: "Asset Link for AVEVA OMI Add-on",
    reference_no: "EALBATC",
    description: "Add-on for Asset Link for AVEVA OMI",
  },
  {
    name: "High Availability Add-on",
    reference_no: "EALBAHC",
    description: "Add-on for High Availability",
  },
  {
    name: "Procedural Automation Add-on",
    reference_no: "EALBAPC",
    description: "Add-on for Procedural Automation",
  },

  // Engineering Upgrade
  {
    name: "Engineering License Upgrade Credit Unit",
    reference_no: "EALBUC",
    description: "EcoStruxure Automation Expert - Engineering license upgrade credit unit",
  },

  // Control Application Licenses
  {
    name: "Control Pack 10 IO Points",
    reference_no: "EALPTXP",
    description: "EcoStruxure Automation Expert - Control pack 10 IO Points",
  },
  {
    name: "Control Pack 100 IO Points",
    reference_no: "EALPTCP",
    description: "EcoStruxure Automation Expert - Control pack 100 IO Points",
  },
  {
    name: "Control Pack 1000 IO Points",
    reference_no: "EALPTMP",
    description: "EcoStruxure Automation Expert - Control pack 1000 IO Points",
  },
  {
    name: "Control Pack 5000 IO Points",
    reference_no: "EALPTVMP",
    description: "EcoStruxure Automation Expert - Control pack 5000 IO Points",
  },
  {
    name: "Control Pack High Availability 100 IO Points",
    reference_no: "EALPTHACP",
    description: "EcoStruxure Automation Expert - Control pack High Availability 100 IO Points",
  },
  {
    name: "Control Pack High Availability 1000 IO Points",
    reference_no: "EALPTHAMP",
    description: "EcoStruxure Automation Expert - Control pack High Availability 1000 IO Points",
  },
  {
    name: "Control Pack High Availability 5000 IO Points",
    reference_no: "EALPTHAVMP",
    description: "EcoStruxure Automation Expert - Control pack High Availability 5000 IO Points",
  },

  // Orchestration Application Licenses
  {
    name: "Orchestration Pack 1 Node",
    reference_no: "EALRIP",
    description: "EcoStruxure Automation Expert - Orchestration pack 1 node",
  },
  {
    name: "Orchestration Pack 10 Nodes",
    reference_no: "EALRXP",
    description: "EcoStruxure Automation Expert - Orchestration pack 10 nodes",
  },
  {
    name: "Orchestration Pack 100 Nodes",
    reference_no: "EALRCP",
    description: "EcoStruxure Automation Expert - Orchestration pack 100 nodes",
  },
  {
    name: "Orchestration Pack 500 Nodes",
    reference_no: "EALRVCP",
    description: "EcoStruxure Automation Expert - Orchestration pack 500 nodes",
  },

  // HMI License
  {
    name: "HMI Runtime - Operator (iPC)",
    reference_no: "EALH2P",
    description: "Automation Expert HMI Runtime - Operator (iPC)",
  },

  // Communication Protocol Licenses
  {
    name: "Communication Protocol OPC UA Client",
    reference_no: "EALCUP",
    description: "Automation Expert - Communication Protocol OPC UA Client",
  },
  {
    name: "Communication Protocol PROFINET RT IO-Controller Client",
    reference_no: "EALCPP",
    description: "Automation Expert - Communication Protocol PROFINET RT IO-Controller Client",
  },
  {
    name: "Communication Protocol EtherCAT Main Device Client",
    reference_no: "EALCEP",
    description: "Automation Expert - Communication Protocol EtherCAT Main Device Client",
  },
  {
    name: "Communication Protocol IEC 61850",
    reference_no: "EALCGP",
    description: "EcoStruxure Automation Expert - Communication Protocol IEC 61850",
  },
];

async function seedLicenses() {
    try {
        const count = await License.countDocuments();

        if (count === 0) {
            await License.insertMany(licenses);
            console.log('Licenses seeded successfully');
        } else {
            console.log('License collection already contains data');
        }
    } catch (err) {
        console.error(err);
    }
}

module.exports = seedLicenses;
