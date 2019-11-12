const { jestConfig } = require('@salesforce/sfdx-lwc-jest/config');
// eslint-disable-next-line no-undef
module.exports = {
    ...jestConfig,
    // add any custom configurations here
    reporters: [
        "default",
        "jest-junit"
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        "force-app/**/*.{js,jsx}",
        "!**/aura/**",
        "!**/lwc-utils/**"
    ],
    coverageReporters: [
        "text",
        "json",
        "cobertura",
        "html"
    ],
    coverageThreshold: {
        "global":{
            "branches": 80,
            "functions": 80,
            "lines": 80,
            "statements": -10
        }
    }
};