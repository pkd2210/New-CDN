<script>
    import * as Card from "$lib/components/ui/card";

    let { data } = $props();

    const buckets = $derived(data.buckets ?? []);
</script>

{#if data.user}
    <div class="mb-4">
        <h2 class="text-2xl font-bold">Welcome, {data.user.name}!</h2>
        <p>Email: {data.user.email}</p>
        <p>User Id: {data.user.id}</p>
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