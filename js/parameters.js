import { PARAMETER_TYPES, getUnitOptions } from './config/parameterTypes.js';
import { generateCombinations, createParameterIndexes, filterCombinations } from './utils/combinations.js';

export class ParameterManager {
    constructor() {
        this.parameters = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('parameterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addParameter();
        });

        document.getElementById('paramType').addEventListener('change', (e) => {
            this.updateUnitOptions(e.target.value);
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadTable();
        });

        // Initialize unit options
        this.updateUnitOptions('NUMBER');
    }

    getParameters() {
        return this.parameters;
    }

    addParameter() {
        const name = document.getElementById('paramName').value.trim();
        const type = document.getElementById('paramType').value;
        const unit = document.getElementById('paramUnit').value;

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
        document.getElementById('parameterForm').reset();
        this.updateUnitOptions('NUMBER');
        
        if (window.mappingManager) {
            window.mappingManager.updateMappingList();
        }
    }

    updateUnitOptions(type) {
        const unitSelect = document.getElementById('paramUnit');
        const units = getUnitOptions(type);
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
            if (window.mappingManager) {
                window.mappingManager.updateMappingList();
            }
        }
    }

    removeValue(parameterId, valueIndex) {
        const parameter = this.parameters.find(p => p.id === parameterId);
        if (parameter) {
            parameter.values.splice(valueIndex, 1);
            this.updateParameterList();
            if (window.mappingManager) {
                window.mappingManager.updateMappingList();
            }
        }
    }

    removeParameter(parameterId) {
        this.parameters = this.parameters.filter(p => p.id !== parameterId);
        this.updateParameterList();
        if (window.mappingManager) {
            window.mappingManager.updateMappingList();
        }
    }

    updateParameterList() {
        const container = document.getElementById('parameterList');
        container.innerHTML = this.parameters.map(param => `
            <div class="parameter-item mb-4 p-4 border rounded-lg">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <h3 class="text-lg font-semibold">${param.name}##${param.type}##${param.unit}</h3>
                    </div>
                    <button onclick="parameterManager.removeParameter('${param.id}')" 
                            class="text-red-600 hover:bg-red-100 p-1 rounded">
                        Delete
                    </button>
                </div>
                <div class="flex gap-2 mb-2">
                    <input type="text" placeholder="Add value" 
                           class="flex-1 px-3 py-1 border rounded"
                           onkeypress="if(event.key === 'Enter') { 
                               event.preventDefault();
                               parameterManager.addValue('${param.id}', this.value);
                               this.value = '';
                           }">
                    <button onclick="parameterManager.addValue('${param.id}', this.previousElementSibling.value);
                                   this.previousElementSibling.value = '';"
                            class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Add
                    </button>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${param.values.map((value, index) => `
                        <span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                            ${value}
                            <button onclick="parameterManager.removeValue('${param.id}', ${index})"
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

    forceUpdatePreview() {
        console.log('Force updating preview');
        this.updatePreview(true);
    }

    updatePreview(forceUpdate = false) {
        console.log('Updating preview with parameters:', this.parameters);
        const previewSection = document.getElementById('previewSection');
        const previewTable = document.getElementById('previewTable');
        
        if (this.parameters.length === 0) {
            previewSection.classList.add('hidden');
            return;
        }

        previewSection.classList.remove('hidden');
        const parameterValues = this.parameters.map(p => p.values);
        const combinations = generateCombinations(parameterValues);

        // Create parameter index mapping
        const parameterIndexes = createParameterIndexes(this.parameters);

        console.log('Generated combinations:', combinations);
        console.log('Parameter indexes:', parameterIndexes);

        // Filter combinations based on applied mapping rules
        const validCombinations = window.mappingManager 
            ? filterCombinations(combinations, parameterIndexes, window.mappingManager)
            : combinations;

        console.log('Valid combinations after filtering:', validCombinations);

        previewTable.innerHTML = `
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
                    ${validCombinations.map((combination, index) => `
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

    downloadTable() {
        const parameterValues = this.parameters.map(p => p.values);
        const combinations = generateCombinations(parameterValues);
        
        // Create parameter index mapping
        const parameterIndexes = createParameterIndexes(this.parameters);

        // Filter combinations based on applied mapping rules
        const validCombinations = window.mappingManager 
            ? filterCombinations(combinations, parameterIndexes, window.mappingManager)
            : combinations;

        const csvContent = this.formatCSV(validCombinations);
        this.downloadCSV(csvContent, 'revit-lookup-table.csv');
    }

    formatCSV(combinations) {
        const headers = ['Description', ...this.parameters.map(p => `${p.name}##${p.type}##${p.unit}`)];
        const rows = combinations.map((combination, index) => [`Row_${index + 1}`, ...combination]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}