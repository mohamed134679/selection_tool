// Central exports for Mongoose models
// Export named properties so callers can do: const { User } = require('../schemas')

module.exports = {
  User: require('./users_schema'),
  // Add other models here as needed, e.g.:
  // Project: require('./projects_schema'),
  // Hardware: require('./hardware_schema'),
};
