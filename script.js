// Parameter Types Configuration
const PARAMETER_TYPES = {
    NUMBER: {
        value: 'NUMBER',
        label: 'Number',
        units: [
            { value: 'GENERAL', label: 'General' },
            { value: 'PERCENTAGE', label: 'Percentage' }
        ]
    },
    LENGTH: {
        value: 'LENGTH',
        label: 'Length',
        units: [
            { value: 'INCHES', label: 'Inches' },
            { value: 'FEET', label: 'Feet' }
        ]
    },
    AREA: {
        value: 'AREA',
        label: 'Area',
        units: [
            { value: 'SQUARE_FEET', label: 'Square Feet' }
        ]
    },
    VOLUME: {
        value: 'VOLUME',
        label: 'Volume',
        units: [
            { value: 'CUBIC_FEET', label: 'Cubic Feet' }
        ]
    },
    ANGLE: {
        value: 'ANGLE',
        label: 'Angle',
        units: [
            { value: 'DEGREES', label: 'Degrees' }
        ]
    },
    OTHER: {
        value: 'OTHER',
        label: 'Other',
        units: [
            { value: 'GENERAL', label: 'General' }
        ]
    }
};

// Utility Functions
function generateCombinations(arrays) {
    if (!arrays || arrays.length === 0) return [[]];
    if (arrays.some(arr => !Array.isArray(arr) || arr.length === 0)) return [];
    
    const [first, ...rest] = arrays;
    const combinations = generateCombinations(rest);
    return first.reduce((acc, x) => [...acc, ...combinations.map(c => [x, ...c])], []);
}

function validateCondition(condition, combination, parameterIndexes) {
    if (!condition.sourceParam || !condition.sourceValue) return true;
    const paramIndex = parameterIndexes[condition.sourceParam];
    if (paramIndex === undefined) return true;
    
    const actualValue = combination[paramIndex];
    const isEqual = actualValue === condition.sourceValue;
    return condition.operator === 'equals' ? isEqual : !isEqual;
}

function validateConsequence(consequence, combination, parameterIndexes) {
    if (!consequence.targetParam || !consequence.targetValue) return true;
    const paramIndex = parameterIndexes[consequence.targetParam];
    if (paramIndex === undefined) return true;
    
    const actualValue = combination[paramIndex];
    const isEqual = actualValue === consequence.targetValue;
    return consequence.operator === 'equals' ? isEqual : !isEqual;
}

function isValidMapping(mapping) {
    return mapping.conditions.length > 0 && 
           mapping.consequences.length > 0 &&
           mapping.conditions.every(c => c.sourceParam && c.sourceValue) &&
           mapping.consequences.every(c => c.targetParam && c.targetValue);
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (!notification || !notificationText) return;
    
    notification.className = `fixed top-4 right-4 max-w-sm p-4 rounded-lg shadow-lg transform transition-transform duration-300 ${
        type === 'success' ? 'bg-gray-800 text-white' : 'bg-red-600 text-white'
    }`;
    
    notificationText.textContent = message;
    notification.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        notification.style.transform = 'translateY(-150%)';
    }, 3000);
}

// Parameter Manager
class ParameterManager {
    constructor() {
        this.parameters = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('parameterForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addParameter();
        });

        document.getElementById('paramType')?.addEventListener('change', (e) => {
            this.updateUnitOptions(e.target.value);
        });

        // Initialize unit options
        this.updateUnitOptions('NUMBER');
    }

    getParameters() {
        return this.parameters;
    }

    addParameter() {
        const name = document.getElementById('paramName')?.value.trim();
        const type = document.getElementById('paramType')?.value;
        const unit = document.getElementById('paramUnit')?.value;

        if (!name) return;

        const parameter = {
            id: crypto.randomUUID(),
            name,
            type,
            unit,
            values: []
        };

        this.parameters.push(parameter);
        this.updateParameterList();
        
        // Reset form
        const form = document.getElementById('parameterForm');
        form?.reset();
        this.updateUnitOptions('NUMBER');
    }

    updateUnitOptions(type) {
        const unitSelect = document.getElementById('paramUnit');
        if (!unitSelect) return;

        const units = PARAMETER_TYPES[type]?.units || [];
        unitSelect.innerHTML = units.map(unit => 
            `<option value="${unit.value}">${unit.label}</option>`
        ).join('');
    }

    addValue(parameterId, value) {
        if (!value.trim()) return;
        
        const parameter = this.parameters.find(p => p.id === parameterId);
        if (parameter) {
            parameter.values.push(value);
            this.updateParameterList();
        }
    }

    removeValue(parameterId, valueIndex) {
        const parameter = this.parameters.find(p => p.id === parameterId);
        if (parameter) {
            parameter.values.splice(valueIndex, 1);
            this.updateParameterList();
        }
    }

    removeParameter(parameterId) {
        this.parameters = this.parameters.filter(p => p.id !== parameterId);
        this.updateParameterList();
    }

    loadParameters(parameters) {
        this.parameters = parameters;
        this.updateParameterList();
    }

    updateParameterList() {
        const container = document.getElementById('parameterList');
        if (!container) return;

        container.innerHTML = this.parameters.map(param => `
            <div class="parameter-item mb-4 p-4 border rounded-lg">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <h3 class="text-lg font-semibold">${param.name}##${param.type}##${param.unit}</h3>
                    </div>
                    <button onclick="window.parameterManager.removeParameter('${param.id}')" 
                            class="text-red-600 hover:bg-red-100 p-1 rounded">
                        Delete
                    </button>
                </div>
                <div class="flex gap-2 mb-2">
                    <input type="text" placeholder="Add value" 
                           class="flex-1 px-3 py-1 border rounded"
                           onkeypress="if(event.key === 'Enter') { 
                               event.preventDefault();
                               window.parameterManager.addValue('${param.id}', this.value);
                               this.value = '';
                           }">
                    <button onclick="window.parameterManager.addValue('${param.id}', this.previousElementSibling.value);
                                   this.previousElementSibling.value = '';"
                            class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Add
                    </button>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${param.values.map((value, index) => `
                        <span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                            ${value}
                            <button onclick="window.parameterManager.removeValue('${param.id}', ${index})"
                                    class="text-gray-500 hover:text-red-600">
                                ×
                            </button>
                        </span>
                    `).join('')}
                </div>
            </div>
        `).join('');

        this.updatePreview();
    }

    updatePreview() {
        const previewSection = document.getElementById('previewSection');
        const previewTable = document.getElementById('previewTable');
        
        if (!previewSection || !previewTable || this.parameters.length === 0) {
            previewSection?.classList.add('hidden');
            return;
        }

        previewSection.classList.remove('hidden');
        const parameterValues = this.parameters.map(p => p.values);
        const combinations = generateCombinations(parameterValues);

        // Create parameter index mapping for validation
        const parameterIndexes = {};
        this.parameters.forEach((param, index) => {
            parameterIndexes[param.id] = index;
        });

        // Filter combinations based on mapping rules
        const validCombinations = window.mappingManager 
            ? combinations.filter(combination => 
                window.mappingManager.validateCombination(combination, parameterIndexes))
            : combinations;

        previewTable.innerHTML = this.generateTableHTML(validCombinations);
    }

    generateTableHTML(combinations) {
        return `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-sm font-semibold text-gray-900">Description</th>
                        ${this.parameters.map(param => `
                            <th class="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                                ${param.name}##${param.type}##${param.unit}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${combinations.map((combination, index) => `
                        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                            <td class="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">Row_${index + 1}</td>
                            ${combination.map(value => `
                                <td class="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">${value}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    forceUpdatePreview() {
        this.updatePreview();
    }
}

// Mapping Manager
class MappingManager {
    constructor(parameterManager) {
        this.parameterManager = parameterManager;
        this.mappings = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('addMapping')?.addEventListener('click', () => {
            this.addMapping();
        });
    }

    getMappings() {
        return this.mappings;
    }

    addMapping() {
        const mappingId = crypto.randomUUID();
        const mapping = {
            id: mappingId,
            conditions: [],
            consequences: [],
            applied: false
        };
        this.mappings.push(mapping);
        this.updateMappingList();
    }

    removeMapping(mappingId) {
        const mapping = this.mappings.find(m => m.id === mappingId);
        if (mapping && mapping.applied) {
            this.mappings = this.mappings.filter(m => m.id !== mappingId);
            this.updateMappingList();
            this.parameterManager.forceUpdatePreview();
        } else {
            this.mappings = this.mappings.filter(m => m.id !== mappingId);
            this.updateMappingList();
        }
    }

    loadMappings(mappings) {
        this.mappings = mappings;
        this.updateMappingList();
        this.parameterManager.forceUpdatePreview();
    }

    validateCombination(combination, parameterIndexes) {
        return this.mappings
            .filter(m => m.applied)
            .every(mapping => {
                const conditionsMet = mapping.conditions.every(condition =>
                    validateCondition(condition, combination, parameterIndexes)
                );

                return conditionsMet ? mapping.consequences.every(consequence =>
                    validateConsequence(consequence, combination, parameterIndexes)
                ) : true;
            });
    }

    updateMappingList() {
        const container = document.getElementById('mappingList');
        if (!container) return;

        const parameters = this.parameterManager.getParameters();
        container.innerHTML = this.mappings.map(mapping => this.generateMappingHTML(mapping, parameters)).join('');
    }

    generateMappingHTML(mapping, parameters) {
        const valid = isValidMapping(mapping);
        const statusClass = mapping.applied ? 'bg-green-50' : (valid ? 'bg-blue-50' : 'bg-red-50');
        const statusText = mapping.applied ? 
            '<span class="text-sm text-green-600">✓ Applied</span>' : 
            (valid ? 
                '<span class="text-sm text-blue-600">Ready to apply</span>' : 
                '<span class="text-sm text-red-600">Incomplete rule</span>');

        return `
            <div class="mapping-rule p-4 border rounded-lg ${statusClass} mb-4">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="text-lg font-semibold">Mapping Rule</h3>
                        ${statusText}
                    </div>
                    <div class="flex gap-2">
                        ${valid ? `
                            <button onclick="window.mappingManager.applyMapping('${mapping.id}')"
                                    class="px-3 py-1 ${mapping.applied ? 'bg-blue-600' : 'bg-green-600'} text-white rounded hover:opacity-90">
                                ${mapping.applied ? 'Update Rule' : 'Apply Rule'}
                            </button>
                        ` : ''}
                        <button onclick="window.mappingManager.removeMapping('${mapping.id}')"
                                class="text-red-600 hover:bg-red-100 p-1 rounded">
                            Delete Rule
                        </button>
                    </div>
                </div>
                
                ${this.generateConditionsHTML(mapping, parameters)}
                ${this.generateConsequencesHTML(mapping, parameters)}
            </div>
        `;
    }

    generateConditionsHTML(mapping, parameters) {
        return `
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    If this condition is true:
                </label>
                <div class="space-y-2">
                    ${mapping.conditions.map((condition, index) => 
                        this.generateConditionHTML(mapping, condition, index, parameters)
                    ).join('')}
                    <button onclick="window.mappingManager.addCondition('${mapping.id}')"
                            class="text-blue-600 hover:text-blue-700 text-sm">
                        + Add Condition
                    </button>
                </div>
            </div>
        `;
    }

    generateConsequencesHTML(mapping, parameters) {
        return `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Then this must also be true:
                </label>
                <div class="space-y-2">
                    ${mapping.consequences.map((consequence, index) => 
                        this.generateConsequenceHTML(mapping, consequence, index, parameters)
                    ).join('')}
                    <button onclick="window.mappingManager.addConsequence('${mapping.id}')"
                            class="text-blue-600 hover:text-blue-700 text-sm">
                        + Add Requirement
                    </button>
                </div>
            </div>
        `;
    }

    generateConditionHTML(mapping, condition, index, parameters) {
        return `
            <div class="flex gap-2 items-center">
                <select onchange="window.mappingManager.updateCondition('${mapping.id}', ${index}, 'sourceParam', this.value)"
                        class="flex-1 px-3 py-2 border rounded-md">
                    <option value="">Select Parameter</option>
                    ${parameters.map(p => `
                        <option value="${p.id}" ${condition.sourceParam === p.id ? 'selected' : ''}>
                            ${p.name}
                        </option>
                    `).join('')}
                </select>
                <select onchange="window.mappingManager.updateCondition('${mapping.id}', ${index}, 'operator', this.value)"
                        class="px-3 py-2 border rounded-md">
                    <option value="equals" ${condition.operator === 'equals' ? 'selected' : ''}>equals</option>
                    <option value="not_equals" ${condition.operator === 'not_equals' ? 'selected' : ''}>not equals</option>
                </select>
                <select onchange="window.mappingManager.updateCondition('${mapping.id}', ${index}, 'sourceValue', this.value)"
                        class="flex-1 px-3 py-2 border rounded-md">
                    <option value="">Select Value</option>
                    ${condition.sourceParam ? parameters.find(p => p.id === condition.sourceParam)?.values.map(value => `
                        <option value="${value}" ${condition.sourceValue === value ? 'selected' : ''}>
                            ${value}
                        </option>
                    `).join('') : ''}
                </select>
                <button onclick="window.mappingManager.removeCondition('${mapping.id}', ${index})"
                        class="text-red-600 hover:bg-red-100 p-1 rounded">
                    ×
                </button>
            </div>
        `;
    }

    generateConsequenceHTML(mapping, consequence, index, parameters) {
        return `
            <div class="flex gap-2 items-center">
                <select onchange="window.mappingManager.updateConsequence('${mapping.id}', ${index}, 'targetParam', this.value)"
                        class="flex-1 px-3 py-2 border rounded-md">
                    <option value="">Select Parameter</option>
                    ${parameters.map(p => `
                        <option value="${p.id}" ${consequence.targetParam === p.id ? 'selected' : ''}>
                            ${p.name}
                        </option>
                    `).join('')}
                </select>
                <select onchange="window.mappingManager.updateConsequence('${mapping.id}', ${index}, 'operator', this.value)"
                        class="px-3 py-2 border rounded-md">
                    <option value="equals" ${consequence.operator === 'equals' ? 'selected' : ''}>must equal</option>
                    <option value="not_equals" ${consequence.operator === 'not_equals' ? 'selected' : ''}>must not equal</option>
                </select>
                <select onchange="window.mappingManager.updateConsequence('${mapping.id}', ${index}, 'targetValue', this.value)"
                        class="flex-1 px-3 py-2 border rounded-md">
                    <option value="">Select Value</option>
                    ${consequence.targetParam ? parameters.find(p => p.id === consequence.targetParam)?.values.map(value => `
                        <option value="${value}" ${consequence.targetValue === value ? 'selected' : ''}>
                            ${value}
                        </option>
                    `).join('') : ''}
                </select>
                <button onclick="window.mappingManager.removeConsequence('${mapping.id}', ${index})"
                        class="text-red-600 hover:bg-red-100 p-1 rounded">
                    ×
                </button>
            </div>
        `;
    }

    addCondition(mappingId) {
        const mapping = this.mappings.find(m => m.id === mappingId);
        if (mapping) {
            mapping.conditions.push({
                sourceParam: '',
                operator: 'equals',
                sourceValue: ''
            });
            mapping.applied = false;
            this.updateMappingList();
        }
    }

    removeCondition(mappingId, index) {
        const mapping = this.mappings.find(m => m.id === mappingId);
        if (mapping) {
            mapping.conditions.splice(index, 1);
            mapping.applied = false;
            this.updateMappingList();
        }
    }

    updateCondition(mappingId, index, field, value) {
        const mapping = this.mappings.find(m => m.id === mappingId);
        if (mapping && mapping.conditions[index]) {
            mapping.conditions[index][field] = value;
            if (field === 'sourceParam') {
                mapping.conditions[index].sourceValue = '';
            }
            mapping.applied = false;
            this.updateMappingList();
        }
    }

    addConsequence(mappingId) {
        const mapping = this.mappings.find(m => m.id === mappingId);
        if (mapping) {
            mapping.consequences.push({
                targetParam: '',
                operator: 'equals',
                targetValue: ''
            });
            mapping.applied = false;
            this.updateMappingList();
        }
    }

    removeConsequence(mappingId, index) {
        const mapping = this.mappings.find(m => m.id === mappingId);
        if (mapping) {
            mapping.consequences.splice(index, 1);
            mapping.applied = false;
            this.updateMappingList();
        }
    }

    updateConsequence(mappingId, index, field, value) {
        const mapping = this.mappings.find(m => m.id === mappingId);
        if (mapping && mapping.consequences[index]) {
            mapping.consequences[index][field] = value;
            if (field === 'targetParam') {
                mapping.consequences[index].targetValue = '';
            }
            mapping.applied = false;
            this.updateMappingList();
        }
    }

    applyMapping(mappingId) {
        const mapping = this.mappings.find(m => m.id === mappingId);
        if (mapping && isValidMapping(mapping)) {
            mapping.applied = true;
            this.updateMappingList();
            this.parameterManager.forceUpdatePreview();
        }
    }
}

// Storage Functions
function exportConfiguration() {
    const configuration = {
        parameters: window.parameterManager.getParameters(),
        mappings: window.mappingManager.getMappings(),
        version: '1.0.0',
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(configuration, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revit-lookup-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importConfiguration(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const configuration = JSON.parse(event.target.result);
                
                if (!configuration.version) {
                    throw new Error('Invalid configuration file');
                }

                window.parameterManager.loadParameters(configuration.parameters);
                window.mappingManager.loadMappings(configuration.mappings);
                
                resolve(configuration);
            } catch (error) {
                reject(new Error('Failed to parse configuration file'));
            }
        };

        reader.onerror = () => reject(new Error('Failed to read configuration file'));
        reader.readAsText(file);
    });
}

// Initialize managers
window.parameterManager = new ParameterManager();
window.mappingManager = new MappingManager(window.parameterManager);

// Setup import/export functionality
document.getElementById('exportBtn')?.addEventListener('click', () => {
    exportConfiguration();
    showNotification('Configuration exported successfully');
});

document.getElementById('importBtn')?.addEventListener('click', () => {
    document.getElementById('importInput')?.click();
});

document.getElementById('importInput')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
        importConfiguration(file)
            .then(() => {
                showNotification('Configuration imported successfully');
                e.target.value = ''; // Reset file input
            })
            .catch(error => {
                showNotification(error.message, 'error');
                e.target.value = ''; // Reset file input
            });
    }
});