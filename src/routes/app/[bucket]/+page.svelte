<script>
    import * as Card from "$lib/components/ui/card";

    let { data } = $props();

    const bucketInfo = $derived(data.bucketInfo ?? null);
    const bucketFiles = $derived(data.bucketFiles ?? []);
</script>

<!-- Back button -->
<button onclick={() => window.open('/app', '_self')} class="mb-4 px-4 py-2 bg-gray-700 text-white rounded">Back</button>

{#if data.user}
    <div class="mb-4">
        <h2 class="text-2xl font-bold">Welcome, {data.user.name}!</h2>
        <p>Email: {data.user.email}</p>
        <p>User Id: {data.user.id}</p>
    </div>
{/if}

{#if bucketInfo}
    <h1 class="text-3xl font-bold mb-4">Bucket: {bucketInfo.name}</h1>
    <p>Created at: {new Date(bucketInfo.createdAt).toLocaleString()}</p>
    <p>Publication: {bucketInfo.publication}</p>
    <p>Used: {((bucketInfo.sizeLimit - bucketInfo.freeSpace) / (1024 * 1024 * 1024)).toFixed(2)} GB / {(bucketInfo.sizeLimit / (1024 * 1024 * 1024)).toFixed(2)} GB</p>
    <p>Created By: {bucketInfo.ownerName}</p>
    <p>Is Owner: {bucketInfo.isOwner ? 'Yes' : 'No'}</p>
{/if}

<div class="mt-8">
    <h2 class="text-2xl font-bold mb-4">Files</h2>

    {#if bucketFiles.length > 0}
        <div class="grid gap-4">
            {#each bucketFiles as file}
                <Card.Root>
                    <Card.Header>
                        <Card.Title>{file.name}</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <p>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <p>Type: {file.mimeType}</p>
                        <p>Created at: {file.createdAt ? new Date(file.createdAt).toLocaleString() : 'Unknown'}</p>
                        <!--Add open and copy buttons -->
                        <button onclick={() => window.open(`/${bucketInfo.name}/${file.name}`, '_blank')} class="mr-2 px-4 py-2 bg-gray-700 text-white rounded">Open</button>
                        <button onclick={() => navigator.clipboard.writeText(`${window.location.origin}/${bucketInfo.name}/${file.name}`)} class="px-4 py-2 bg-gray-500 text-white rounded">Copy Link</button>
                    </Card.Content>
                </Card.Root>
            {/each}
        </div>
    {:else}
        <p>No files in this bucket.</p>
    {/if}
</div>