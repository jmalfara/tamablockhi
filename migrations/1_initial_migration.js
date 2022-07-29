const Contract = artifacts.require("Migrations");

module.exports = deployer => {
  deployer.deploy(Contract);
};
