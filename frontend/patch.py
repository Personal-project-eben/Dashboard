import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add imports
imports = """import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { GripHorizontal } from 'lucide-react'
"""
content = content.replace("import './App.css'", "import './App.css'\n" + imports)

# Remove onMove from WidgetCard
content = re.sub(r'onMove: \(direction: -1 \| 1\) => void\n', '', content)
content = re.sub(r'onMove: \(-1 \| 1\) => void\n', '', content) # just in case
content = re.sub(r'onMove,\n', '', content)
content = content.replace("<button type=\"button\" onClick={() => onMove(-1)} disabled={index === 0}>Monter</button>", "")
content = content.replace("<button type=\"button\" onClick={() => onMove(1)} disabled={index === total - 1}>Descendre</button>", "")

# Dashboard updates
drag_func = """
  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index
    if (sourceIndex === destinationIndex) return

    const next = Array.from(widgets)
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(destinationIndex, 0, moved)
    setWidgets(next)

    await Promise.all(
      next.map((w, idx) => updateWidget(w.id, { position: idx }))
    ).catch(() => undefined)
  }

"""
content = content.replace("async function handleMove", drag_func + "async function handleMove")
# actually let's just replace handleMove completely
content = re.sub(r'async function handleMove[\s\S]*?\}\n', '', content)

grid_start = '<section className="widget-grid">'
grid_end = '</section>'

new_grid = """      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets" direction="horizontal">
          {(provided) => (
            <section className="widget-grid" ref={provided.innerRef} {...provided.droppableProps}>
              {widgets.map((instance, index) => (
                <Draggable key={instance.id} draggableId={instance.id} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{...provided.draggableProps.style, height: '100%'}}>
                      <WidgetCard
                        instance={instance}
                        index={index}
                        total={widgets.length}
                        onDelete={() => handleDelete(instance.id)}
                        onSave={(config, refreshRate) => handleSave(instance.id, config, refreshRate)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <button type="button" className="add-widget" onClick={() => setShowAdd(true)}>
                <span>+</span>
                <strong>Ajouter un widget</strong>
                <small>Choisir parmi vos services</small>
              </button>
            </section>
          )}
        </Droppable>
      </DragDropContext>"""

content = re.sub(r'<section className="widget-grid">[\s\S]*?<\/section>', new_grid, content)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("App.tsx patched")
