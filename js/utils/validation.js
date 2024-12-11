// Validation utilities for mapping rules
export const validateCondition = (condition, combination, parameterIndexes) => {
    if (!condition.sourceParam || !condition.sourceValue) return true;
    const paramIndex = parameterIndexes[condition.sourceParam];
    if (paramIndex === undefined) return true;
    
    const actualValue = combination[paramIndex];
    const isEqual = actualValue === condition.sourceValue;
    return condition.operator === 'equals' ? isEqual : !isEqual;
};

export const validateConsequence = (consequence, combination, parameterIndexes) => {
    if (!consequence.targetParam || !consequence.targetValue) return true;
    const paramIndex = parameterIndexes[consequence.targetParam];
    if (paramIndex === undefined) return true;
    
    const actualValue = combination[paramIndex];
    const isEqual = actualValue === consequence.targetValue;
    return consequence.operator === 'equals' ? isEqual : !isEqual;
};

export const isValidMapping = (mapping) => {
    return mapping.conditions.length > 0 && 
           mapping.consequences.length > 0 &&
           mapping.conditions.every(c => c.sourceParam && c.sourceValue) &&
           mapping.consequences.every(c => c.targetParam && c.targetValue);
};