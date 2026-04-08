<script>
    import * as Card from "$lib/components/ui/card";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";

    let { data } = $props();

    const buckets = $derived(data.buckets ?? []);

    let createBucketOpen = $state(false);
    let newBucketName = $state('');
    let useMyselfAsOwner = $state(true);
    let ownerId = $state('');
    let sizeLimitGb = $state(5);
    let publication = $state('private');

    async function submitCreateBucket() {
        if (!newBucketName.trim()) {
            alert('Bucket name is required');
            return;
        }

        const response = await fetch(`/api/buckets/create/${encodeURIComponent(newBucketName.trim())}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                useMyselfAsOwner,
                ownerId,
                sizeLimitGb,
                publication
            })
        });

        if (response.ok) {
            alert('Bucket created successfully');
            createBucketOpen = false;
            newBucketName = '';
            ownerId = '';
            sizeLimitGb = 5;
            publication = 'private';
            window.location.reload();
            return;
        }

        const errorMessage = await response.text();
        alert(errorMessage || 'Failed to create bucket');
    }
</script>

{#if data.user}
    <div class="mb-4">
        <h2 class="text-2xl font-bold">Welcome, {data.user.name}!</h2>
        <p>Email: {data.user.email}</p>
        <p>User Id: {data.user.id}</p>
    </div>
{/if}
{#if data.user?.isAdmin}
    <div class="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <p>You are an admin user. You have permissions to manage all buckets and files.</p> 
        <AlertDialog.Root bind:open={createBucketOpen}>
            <AlertDialog.Trigger class="px-4 py-2 bg-gray-500 text-white rounded">
                Create Bucket
            </AlertDialog.Trigger>
            <AlertDialog.Content>
                <AlertDialog.Header>
                    <AlertDialog.Title>Create Bucket</AlertDialog.Title>
                </AlertDialog.Header>
                <AlertDialog.Description>
                    <div class="space-y-3 text-left">
                        <div>
                            <p class="mb-1">Bucket name</p>
                            <input bind:value={newBucketName} type="text" placeholder="Bucket Name" class="w-full rounded border px-2 py-1" />
                        </div>
                        <div>
                            <label class="inline-flex items-center gap-2">
                                <input bind:checked={useMyselfAsOwner} type="checkbox" />
                                <span>Use myself as owner</span>
                            </label>
                        </div>
                        {#if !useMyselfAsOwner}
                            <div>
                                <p class="mb-1">Owner user id</p>
                                <input bind:value={ownerId} type="text" placeholder="Owner user id" class="w-full rounded border px-2 py-1" />
                            </div>
                        {/if}
                        <div>
                            <p class="mb-1">Size limit (GB)</p>
                            <input bind:value={sizeLimitGb} type="number" min="1" step="1" class="w-full rounded border px-2 py-1" />
                        </div>
                        <div>
                            <p class="mb-1">Publication</p>
                            <select bind:value={publication} class="w-full rounded border px-2 py-1">
                                <option value="private">Private</option>
                                <option value="public">Public</option>
                            </select>
                        </div>
                    </div>
                </AlertDialog.Description>
                <AlertDialog.Footer>
                    <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                    <AlertDialog.Action onclick={submitCreateBucket}>Create</AlertDialog.Action>
                </AlertDialog.Footer>
            </AlertDialog.Content>
        </AlertDialog.Root>
    </div>
{/if}
{#each buckets as bucket}
<a href={`/app/${bucket.name}`} class="w-full mb-4 text-center">
    <Card.Root>
        <Card.Header>
            <Card.Title>{bucket.name}</Card.Title>
        </Card.Header>
        <Card.Content>
            <p>Created at: {new Date(bucket.createdAt).toLocaleString()}</p>
            <p>Publication: {bucket.publication}</p>
            <p>Used: {((bucket.sizeLimit - bucket.freeSpace) / (1024 * 1024 * 1024)).toFixed(2)} GB / {(bucket.sizeLimit / (1024 * 1024 * 1024)).toFixed(2)} GB</p>
            <p>Created By: {bucket.ownerName}</p>
            <p>Is Owner: {bucket.isOwner ? 'Yes' : 'No'}</p>
        </Card.Content>
    </Card.Root>
</a>
{/each} 
{#if buckets.length === 0}
    <p>No buckets found. Create your first bucket to get started!</p>
{/if}