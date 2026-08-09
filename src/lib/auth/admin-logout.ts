export const ADMIN_LOGOUT_REDIRECT = '/login';
export const ADMIN_LOGOUT_ERROR_MESSAGE = 'تعذر تسجيل الخروج. حاول مرة أخرى.';

export type AdminSignOutClient = {
  signOut: (options?: {
    fetchOptions?: {
      onSuccess?: () => void;
    };
  }) => Promise<unknown>;
};

export async function performAdminSignOut(
  client: AdminSignOutClient,
  redirect: (url: string) => void,
): Promise<void> {
  let redirected = false;

  await client.signOut({
    fetchOptions: {
      onSuccess: () => {
        redirected = true;
        redirect(ADMIN_LOGOUT_REDIRECT);
      },
    },
  });

  if (!redirected) {
    redirect(ADMIN_LOGOUT_REDIRECT);
  }
}
