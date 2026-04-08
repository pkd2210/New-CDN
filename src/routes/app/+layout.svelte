<script>
	import '../../app.css';
    import { ModeWatcher } from "mode-watcher";

	let { children } = $props();
    async function logout() {
        await fetch('/api/auth/sign-out', {
            method: 'POST'
        });
        window.location.href = '/login';
    }
</script>
<button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onclick={logout}>Logout</button>
<ModeWatcher />
{@render children()}
