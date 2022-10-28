import { defineComponent, h } from 'vue'

const Monitor = defineComponent({
  name: 'DashboardMonitor',

  setup() {
    return () => {
      return <h3>Dashboard Monitor</h3>
    }
  },
})

export default Monitor
