<template>
  <div>Count: {{ count }}</div>
  <button @click="inc()">Increment</button>
  <button @click="dec()">Decrement</button>
  <span class="ml-2">/</span>
  <button @click="commitAll()">Commit</button>
  <button :disabled="!canUndo" @click="undoAll()">Undo</button>
  <button :disabled="!canRedo" @click="redoAll()">Redo</button>
  <button @click="clearAll()">Clear</button>
  <button @click="resetAll()">Reset</button>

  <div flex items-center gap-32>
    <!-- <div>
      <h2>Custom</h2>

      <div>last is {{ last }}</div>
      <br />

      <div>
        <div>Undo Stack</div>
        <div v-for="i in undoStack" :key="i.timestamp">{{ i.snapshot }}</div>
      </div>

      <br />

      <div>
        <div>Redo Stack</div>
        <div v-for="i in redoStack" :key="i.timestamp">{{ i.snapshot }}</div>
      </div>

      <br />
      <note>History (limited to 10 records for demo)</note>
      <div class="code-block mt-4">
        <div v-for="i in history" :key="i.timestamp">
          <span class="opacity-50 mr-2 font-mono">{{ i.timestamp }}</span>
          <span class="font-mono">{ value: {{ i.snapshot }} }</span>
        </div>
      </div>
    </div> -->

    <div>
      <h2>Vueuse</h2>

      <div>last is {{ _last }}</div>
      <br />

      <div>source is {{ _source }}</div>
      <br />

      <div>
        <div>Undo Stack</div>
        <div v-for="i in _undoStack" :key="i.timestamp">{{ i.snapshot }}</div>
      </div>

      <br />

      <div>
        <div>Redo Stack</div>
        <div v-for="i in _redoStack" :key="i.timestamp">{{ i.snapshot }}</div>
      </div>

      <br />
      <note>History (limited to 10 records for demo)</note>
      <div class="code-block mt-4">
        <div v-for="i in _history" :key="i.timestamp">
          <span class="opacity-50 mr-2 font-mono">{{ i.timestamp }}</span>
          <span class="font-mono">{ value: {{ i.snapshot }} }</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup name="UseManualRefHistory">
import { ref } from 'vue'
import { useManualRefHistory } from '../core'
import { useManualRefHistory as _useManualRefHistory } from '@vueuse/core'

const count = ref(0)

// const {
//   history,
//   canRedo,
//   canUndo,
//   last,
//   undoStack,
//   redoStack,
//   undo,
//   redo,
//   commit,
//   clear,
//   reset,
// } = useManualRefHistory(count, { capacity: 5 })

const {
  history: _history,
  last: _last,
  undoStack: _undoStack,
  redoStack: _redoStack,
  undo: _undo,
  redo: _redo,
  commit: _commit,
  clear: _clear,
  reset: _reset,
  source: _source,
  canRedo,
  canUndo,
} = _useManualRefHistory(count, { capacity: 5, parse: value => value + 1 })

function inc() {
  count.value++
}

function dec() {
  count.value--
}

function commitAll() {
  // commit()
  _commit()
}

function undoAll() {
  // undo()
  _undo()
}

function redoAll() {
  // redo()
  _redo()
}

function clearAll() {
  // clear()
  _clear()
}

function resetAll() {
  // reset()
  _reset()
}
</script>
