/**
 * FormBuilder.jsx
 * Reusable admin component to build custom registration form questions.
 * Supports short_answer, paragraph, and multiple_choice question types.
 * Used in CreateEvent and EditEvent pages.
 */
import { Plus, Trash2, GripVertical } from 'lucide-react'
import './FormBuilder.css'

// Label shown to admin for each field type
const TYPE_LABELS = {
  short_answer: 'Short Answer',
  paragraph: 'Paragraph',
  multiple_choice: 'Multiple Choice',
}

/**
 * @param {{ fields: Array, onChange: (fields: Array) => void }} props
 */
const FormBuilder = ({ fields = [], onChange }) => {
  // Add a new blank field
  const addField = () => {
    onChange([
      ...fields,
      { label: '', type: 'short_answer', options: [], required: false, _tempId: Date.now() },
    ])
  }

  // Remove a field by index
  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  // Update a single field property
  const updateField = (index, key, value) => {
    onChange(
      fields.map((f, i) => (i === index ? { ...f, [key]: value } : f))
    )
  }

  // Add an option to a multiple_choice field
  const addOption = (index) => {
    const updated = [...(fields[index].options || []), '']
    updateField(index, 'options', updated)
  }

  // Update a specific option text
  const updateOption = (fieldIndex, optionIndex, value) => {
    const opts = fields[fieldIndex].options.map((o, i) =>
      i === optionIndex ? value : o
    )
    updateField(fieldIndex, 'options', opts)
  }

  // Remove a specific option
  const removeOption = (fieldIndex, optionIndex) => {
    const opts = fields[fieldIndex].options.filter((_, i) => i !== optionIndex)
    updateField(fieldIndex, 'options', opts)
  }

  return (
    <div className="form-builder">
      <div className="fb-header">
        <span className="fb-title">Registration Form Questions</span>
        <span className="fb-hint">
          Students will fill these out when registering. Leave empty for no custom form.
        </span>
      </div>

      {fields.length === 0 ? (
        <div className="fb-empty">No questions yet — add one below.</div>
      ) : (
        <div className="fb-fields">
          {fields.map((field, idx) => (
            <div key={field._id || field._tempId || idx} className="fb-field-card">
              <div className="fb-field-row">
                <GripVertical size={14} className="fb-drag-handle" />
                <span className="fb-field-num">Q{idx + 1}</span>

                {/* Question label */}
                <input
                  type="text"
                  className="fb-label-input"
                  value={field.label}
                  onChange={(e) => updateField(idx, 'label', e.target.value)}
                  placeholder="Question text…"
                  required
                />

                {/* Field type */}
                <select
                  className="fb-type-select"
                  value={field.type}
                  onChange={(e) => updateField(idx, 'type', e.target.value)}
                >
                  {Object.entries(TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>

                {/* Required toggle */}
                <label className="fb-required-label">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(idx, 'required', e.target.checked)}
                  />
                  Required
                </label>

                <button
                  type="button"
                  className="fb-remove-btn"
                  onClick={() => removeField(idx)}
                  title="Remove question"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Multiple choice options */}
              {field.type === 'multiple_choice' && (
                <div className="fb-options">
                  <span className="fb-options-label">Answer Options:</span>
                  {(field.options || []).map((opt, oi) => (
                    <div key={oi} className="fb-option-row">
                      <span className="fb-option-bullet">○</span>
                      <input
                        type="text"
                        className="fb-option-input"
                        value={opt}
                        onChange={(e) => updateOption(idx, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                      />
                      <button
                        type="button"
                        className="fb-remove-option"
                        onClick={() => removeOption(idx, oi)}
                        title="Remove option"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="fb-add-option" onClick={() => addOption(idx)}>
                    + Add option
                  </button>
                </div>
              )}

              {/* Preview for short_answer / paragraph */}
              {field.type === 'short_answer' && (
                <div className="fb-preview fb-preview-short">Short text answer</div>
              )}
              {field.type === 'paragraph' && (
                <div className="fb-preview fb-preview-para">Long text answer (paragraph)</div>
              )}
            </div>
          ))}
        </div>
      )}

      <button type="button" className="fb-add-field-btn" onClick={addField}>
        <Plus size={15} />
        Add Question
      </button>
    </div>
  )
}

export default FormBuilder
