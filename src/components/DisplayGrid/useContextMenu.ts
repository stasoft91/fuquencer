import {nextTick, type Ref, ref} from "vue";

export const useContextMenu = () => {
	const isDropdownOpened = ref(false)
	const x = ref(0)
	const y = ref(0)
	
	const selectedItem: Ref<any> = ref(null)
	
	const onClickoutside = () => {
		isDropdownOpened.value = false
	}
	
	const handleContextMenu = (item: any, event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		
		nextTick().then(() => {
			x.value = event.clientX
			y.value = event.clientY
			selectedItem.value = item
			
			isDropdownOpened.value = true
		})
	}
	
	return {
		isDropdownOpened,
		x,
		y,
		onClickoutside,
		handleContextMenu,
		selectedItem
	}
}
