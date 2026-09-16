const { jestConfig } = require('@salesforce/sfdx-lwc-jest/config');

module.exports = {
    ...jestConfig,
    modulePathIgnorePatterns: ['<rootDir>/.localdevserver'],
    moduleNameMapper: {
        '^lwr/navigation$': '<rootDir>/force-app/main/default/lwc/__mocks__/lwr/navigation.js'
    }
};
