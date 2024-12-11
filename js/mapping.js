import { validateCondition, validateConsequence, isValidMapping } from './utils/validation.js';

export class MappingManager {
    constructor(parameterManager) {
        this.parameterManager = parameterManager;
        this.mappings = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('addMapping').addEventListener('click', () => this.addMapping());
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

    applyMapping(mappingId) {
        const mapping = this.mappings.find(m => m.id === mappingId);
        if (mapping && isValidMapping(mapping)) {
            mapping.applied = true;
            this.updateMappingList();
            this.parameterManager.forceUpdatePreview();
        }
    }

    validateCombination(combination, parameterIndexes) {
        const appliedMappings = this.mappings.filter(m => m.applied);
        if (!appliedMappings.length) return true;

        return appliedMappings.every(mapping => {
            // Check if all conditions are met
            const conditionsMet = mapping.conditions.every(condition =>
                validateCondition(condition, combination, parameterIndexes)
            );

            // If conditions are met, validate consequences
            if (conditionsMet) {
                return mapping.consequences.every(consequence =>
                    validateConsequence(consequence, combination, parameterIndexes)
                );
            }

            return true;
        });
    }

    updateMappingList() {
        const container = document.getElementById('mappingList');
        const parameters = this.parameterManager.getParameters();
        
        container.innerHTML = this.mappings.map(mapping => {
            const valid = isValidMapping(mapping);
            const statusClass = mapping.applied ? 'bg-green-50' : (valid ? 'bg-blue-50' : 'bg-red-50');
            const statusText = mapping.applied ? 
                '<span class="text-sm text-green-600">✓ Applied</span>' : 
                (valid ? 
                    '<span class="text-sm text-blue-600">Ready to apply</span>' : 
                    '<span class="text-sm text-red-600">Incomplete rule</span>');

            return `
                <div class="mapping-rule p-4 border rounded-lg ${statusClass}">
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
                    
                    <div class="space-y-4">
                        ${this.renderConditions(mapping, parameters)}
                        ${this.renderConsequences(mapping, parameters)}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderConditions(mapping, parameters) {
        return `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    If this condition is true:
                </label>
                <div class="space-y-2">
                    ${mapping.conditions.map((condition, index) => this.renderCondition(mapping, condition, index, parameters)).join('')}
                    <button onclick="window.mappingManager.addCondition('${mapping.id}')"
                            class="text-blue-600 hover:text-blue-700 text-sm">
                        + Add Condition
                    </button>
                </div>
            </div>
        `;
    }

    renderCondition(mapping, condition, index, parameters) {
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

    renderConsequences(mapping, parameters) {
        return `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Then this must also be true:
                </label>
                <div class="space-y-2">
                    ${mapping.consequences.map((consequence, index) => this.renderConsequence(mapping, consequence, index, parameters)).join('')}
                    <button onclick="window.mappingManager.addConsequence('${mapping.id}')"
                            class="text-blue-600 hover:text-blue-700 text-sm">
                        + Add Requirement
                    </button>
                </div>
            </div>
        `;
    }

    renderConsequence(mapping, consequence, index, parameters) {
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
}