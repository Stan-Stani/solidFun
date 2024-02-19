import { children, JSX, type Component } from 'solid-js'

import styles from './styles.module.css'

const Shelf: Component<{children: JSX.Element}> = (props) => {
  const c = children(() => props.children);
  return (
    <div class={styles.outer}>
        {c()}
    </div>
  )
}

export default Shelf