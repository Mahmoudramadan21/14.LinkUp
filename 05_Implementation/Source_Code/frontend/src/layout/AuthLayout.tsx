import Head from "next/head";
import Image from "next/image";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title = "LinkUp | Sign In" }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Sign up or log in to LinkUp to connect with friends and share your moments." />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
        <meta name="csrf-token" content="dummy-csrf-token" />
      </Head>

      <div className="auth-layout">
        <div className="auth-layout__liquid">
          <Image
            src="/svgs/liquid.svg"
            alt=""
            width={600}
            height={636}
            className="auth-layout__liquid-image"
            aria-hidden="true"
          />
        </div>

        <div className="auth-layout__footer">
          <Image
            src="/svgs/footer.svg"
            alt=""
            width={1439}
            height={214}
            className="auth-layout__footer-image"
            aria-hidden="true"
          />
        </div>

        <div className="auth-layout__container container">{children}</div>
      </div>
    </>
  );
};

export default AuthLayout;