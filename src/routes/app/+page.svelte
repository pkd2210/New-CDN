<script>
    import * as Card from "$lib/components/ui/card";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import * as Input from "$lib/components/ui/input";
    import * as Label from "$lib/components/ui/label";

    let { data } = $props();

    const buckets = $derived(data.buckets ?? []);

    let createBucketOpen = $state(false);
    let createUserOpen = $state(false);
    let newBucketName = $state('');
    let useMyselfAsOwner = $state(true);
    let ownerId = $state('');
    let sizeLimitGb = $state(5);
    let publication = $state('private');

    let newUserName = $state('');
    let newUserEmail = $state('');
    let newUserPassword = $state('');

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

    async function submitCreateUser() {
        if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
            alert('Name, email, and password are required');
            return;
        }

        const response = await fetch('/api/users/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: newUserName.trim(),
                email: newUserEmail.trim(),
                password: newUserPassword
            })
        });

        if (response.ok) {
            alert('User created successfully');
            createUserOpen = false;
            newUserName = '';
            newUserEmail = '';
            newUserPassword = '';
            return;
        }

        const errorMessage = await response.text();
        alert(errorMessage || 'Failed to create user');
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
    <div class="mb-4 rounded border border-yellow-400 bg-yellow-100 p-4 text-yellow-900">
        <p class="font-medium">Admin menu</p>
        <p class="mt-1 text-sm text-yellow-800">Create buckets or users from here.</p>

        <div class="mt-4 flex flex-wrap gap-3">
            <AlertDialog.Root bind:open={createBucketOpen}>
                <AlertDialog.Trigger class="rounded bg-gray-700 px-4 py-2 text-white">
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
                                <Input.Root bind:value={newBucketName} type="text" placeholder="Bucket Name" class="w-full rounded border px-2 py-1" />
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
                                    <Input.Root bind:value={ownerId} type="text" placeholder="Owner user id" class="w-full rounded border px-2 py-1" />
                                </div>
                            {/if}
                            <div>
                                <p class="mb-1">Size limit (GB)</p>
                                <Input.Root bind:value={sizeLimitGb} type="number" min="1" step="1" class="w-full rounded border px-2 py-1" />
                            </div>
                            <div>
                                <Label.Root class="mb-1 block">Publication</Label.Root>
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

            <AlertDialog.Root bind:open={createUserOpen}>
                <AlertDialog.Trigger class="rounded bg-blue-600 px-4 py-2 text-white">
                    Create User
                </AlertDialog.Trigger>
                <AlertDialog.Content>
                    <AlertDialog.Header>
                        <AlertDialog.Title>Create User</AlertDialog.Title>
                    </AlertDialog.Header>
                    <AlertDialog.Description>
                        <div class="space-y-3 text-left">
                            <div>
                                <p class="mb-1">Name</p>
                                <Input.Root bind:value={newUserName} type="text" placeholder="Full name" class="w-full rounded border px-2 py-1" />
                            </div>
                            <div>
                                <p class="mb-1">Email</p>
                                <Input.Root bind:value={newUserEmail} type="email" placeholder="Email address" class="w-full rounded border px-2 py-1" />
                            </div>
                            <div>
                                <p class="mb-1">Password</p>
                                <Input.Root bind:value={newUserPassword} type="password" placeholder="Password" class="w-full rounded border px-2 py-1" />
                            </div>
                        </div>
                    </AlertDialog.Description>
                    <AlertDialog.Footer>
                        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                        <AlertDialog.Action onclick={submitCreateUser}>Create</AlertDialog.Action>
                    </AlertDialog.Footer>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </div>
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