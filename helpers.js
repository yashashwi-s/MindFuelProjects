
const getClientOrganization = (client) => {
    if (client) {
      return client.organization;
    } else {
      return "Client Not Found";
    }
  };
  
  module.exports = getClientOrganization;
  