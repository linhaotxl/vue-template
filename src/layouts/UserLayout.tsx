import { defineComponent, h, Fragment } from 'vue'
import { RouterView } from 'vue-router'

const UserLayout = defineComponent({
  name: 'UserLayout',

  setup() {
    return () => {
      return (
        <>
          <h1>User Layout</h1>

          <RouterView />
        </>
      )
    }
  },
})

export default UserLayout
