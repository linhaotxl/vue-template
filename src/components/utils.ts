export const genData = (length: number) =>
  Array.from(Array(length).keys()).map(i => ({
    height: itemHeight(i),
    size: i % 2 === 0 ? 'small' : 'large',
    label: `第${i + 1}项`,
  }))

export const itemHeight = (i: number) => (i % 2 === 0 ? 42 + 8 : 84 + 8)
