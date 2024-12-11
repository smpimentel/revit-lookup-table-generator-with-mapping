// Utilities for handling parameter combinations
export const generateCombinations = (arrays) => {
    if (!arrays || arrays.length === 0) return [[]];
    if (arrays.some(arr => !Array.isArray(arr) || arr.length === 0)) return [];
    
    const [first, ...rest] = arrays;
    const combinations = generateCombinations(rest);
    return first.reduce((acc, x) => [...acc, ...combinations.map(c => [x, ...c])], []);
};

export const createParameterIndexes = (parameters) => {
    const indexes = {};
    parameters.forEach((param, index) => {
        indexes[param.id] = index;
    });
    return indexes;
};

export const filterCombinations = (combinations, parameterIndexes, mappingManager) => {
    if (!mappingManager) return combinations;
    
    return combinations.filter(combination => 
        mappingManager.validateCombination(combination, parameterIndexes)
    );
};