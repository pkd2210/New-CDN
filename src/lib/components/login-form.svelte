<script>
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldError,
		FieldDescription,
	} from "$lib/components/ui/field/index.js";

	const id = $props.id();
	let email = $state("");
	let password = $state("");
	let isSubmitting = $state(false);
	let errorMessage = $state("");

	async function handleSubmit(event) {
		event.preventDefault();
		errorMessage = "";
		isSubmitting = true;

		try {
			const response = await fetch("/api/auth/sign-in/email", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					email,
					password,
					rememberMe: true,
				}),
			});

			if (!response.ok) {
				let message = "Invalid email or password.";
				try {
					const payload = await response.json();
					message = payload?.message ?? payload?.error?.message ?? message;
				} catch {
					// Keep default message if response is not JSON.
				}
				errorMessage = message;
				return;
			}

			await goto("/app", { invalidateAll: true });
		} catch {
			errorMessage = "Could not connect to the auth server. Please try again.";
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleSubmit}>
			<FieldGroup>
				<Field>
					<FieldLabel for="email-{id}">Email</FieldLabel>
					<Input
						id="email-{id}"
						type="email"
						placeholder="m@example.com"
						autocomplete="email"
						bind:value={email}
						required
					/>
				</Field>
				<Field>
					<div class="flex items-center">
						<FieldLabel for="password-{id}">Password</FieldLabel>
					</div>
					<Input
						id="password-{id}"
						type="password"
						autocomplete="current-password"
						bind:value={password}
						required
					/>
				</Field>
				<Field>
					<Button type="submit" class="w-full" disabled={isSubmitting}>
						{isSubmitting ? "Signing in..." : "Login"}
					</Button>
					{#if errorMessage}
						<FieldError>{errorMessage}</FieldError>
					{/if}
				</Field>
			</FieldGroup>
		</form>
	</Card.Content>
</Card.Root>