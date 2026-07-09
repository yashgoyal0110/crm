import { LoginComponent } from "./components/LoginComponent";

const SignInPage = async () => {
  return (
    <div className="h-full">
      <div className="py-10">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          {process.env.NEXT_PUBLIC_APP_NAME || "AtlasIQ"}
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          AI sales intelligence for B2B distributors: enrich accounts, qualify
          contacts, and manage pipeline in one workspace.
        </p>
      </div>
      <div>
        <LoginComponent />
      </div>
    </div>
  );
};

export default SignInPage;
