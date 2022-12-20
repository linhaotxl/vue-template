import { ElButton } from 'element-plus'
import { RouterView } from 'vue-router'

const UserLayout = defineComponent({
  name: 'UserLayout',

  setup() {
    return () => {
      return (
        <>
          <h1>User Layout</h1>

          <ElButton>222</ElButton>

          <RouterView />
        </>
      )
    }
  },
})

export default UserLayout
