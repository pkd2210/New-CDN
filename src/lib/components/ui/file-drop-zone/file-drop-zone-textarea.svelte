<script>
	import { useFileDropZoneTextarea } from './file-drop-zone.svelte.js';
	import { box, mergeProps } from 'svelte-toolbelt';
	let { onpaste, ondragover, ondrop, child, ...rest } = $props();

	const fileDropZoneTextareaState = useFileDropZoneTextarea({
		onpaste: box.with(() => onpaste),
		ondragover: box.with(() => ondragover),
		ondrop: box.with(() => ondrop)
	});

	const mergedProps = $derived(mergeProps(fileDropZoneTextareaState.props, rest));
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<textarea {...mergedProps}></textarea>
{/if}