import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import SequencerGrid from '../SequencerGrid.vue'

describe('HelloWorld', () => {
  it('renders properly', () => {
    const wrapper = mount(SequencerGrid, { props: { msg: 'Hello Vitest' } })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})
