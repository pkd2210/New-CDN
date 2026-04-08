<script>
    import * as Card from "$lib/components/ui/card";
    import * as FileDropZone from '$lib/components/ui/file-drop-zone';

    let { data } = $props();

    const bucketInfo = $derived(data.bucketInfo ?? null);
    const bucketFiles = $derived(data.bucketFiles ?? []);
    const sortedFiles = $derived([...bucketFiles].reverse());

    async function handleFileUpload(files) {
        if (!files || files.length === 0) return;
        
        let uploadedCount = 0;
        let failedCount = 0;

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`/api/files/upload/${bucketInfo.name}`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    uploadedCount++;
                } else {
                    const error = await response.text();
                    console.error(`Failed to upload ${file.name}:`, error);
                    failedCount++;
                }
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                failedCount++;
            }
        }

        if (uploadedCount > 0) {
            alert(`${uploadedCount} file(s) uploaded successfully`);
            window.location.reload();
        } else if (failedCount > 0) {
            alert(`Failed to upload ${failedCount} file(s). Check the console for details.`);
        }
    }

    async function deleteFile(fileName) {
        if (!confirm(`Are you sure you want to delete ${fileName}? This action cannot be undone.`)) {
            return;
        }

        const response = await fetch(`/api/files/delete/${bucketInfo.name}/${fileName}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('File deleted successfully');
            // Refresh the page to update the file list
            window.location.reload();
        } else {
            alert('Failed to delete file');
        }
    }
    async function deleteBucket() {
        if (!confirm(`Are you sure you want to delete the bucket ${bucketInfo.name}? This action cannot be undone and will delete all files in the bucket.`)) {
            return;
        }

        const response = await fetch(`/api/bucket/delete/${bucketInfo.name}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Bucket deleted successfully');
            // Redirect to the main app page
            window.location.href = '/app';
        } else {
            alert('Failed to delete bucket');
        }
    }
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
    {#if bucketInfo.isOwner}
        <button onclick={deleteBucket} class="mt-4 px-4 py-2 bg-red-500 text-white rounded">Delete Bucket</button>
    {/if}
{/if}

<div class="my-8">
    <h2 class="text-2xl font-bold mb-4">Upload Files</h2>
    <FileDropZone.Root onUpload={handleFileUpload}>
        <FileDropZone.Trigger />
        <FileDropZone.Textarea />
    </FileDropZone.Root>
</div>

<div class="mt-8">
    <h2 class="text-2xl font-bold mb-4">Files</h2>

    {#if bucketFiles.length > 0}
        <div class="grid gap-4">
            {#each sortedFiles as file}
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
                        <button onclick={() => navigator.clipboard.writeText(`${window.location.origin}/${bucketInfo.name}/${file.name}`)} class="mr-2 px-4 py-2 bg-gray-500 text-white rounded">Copy Link</button>
                        <button onclick={() => {deleteFile(file.name)}} class="mr-2 px-4 py-2 bg-red-500 text-white rounded">Delete</button>
                    </Card.Content>
                </Card.Root>
            {/each}
        </div>
    {:else}
        <p>No files in this bucket.</p>
    {/if}
</div>