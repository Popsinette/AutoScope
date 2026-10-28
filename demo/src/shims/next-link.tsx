import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link } from "react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

/** Remplace next/link dans la démo : navigation côté client via React Router. */
const NextLink = forwardRef<HTMLAnchorElement, Props>(function NextLink({ href, prefetch: _p, scroll: _s, replace, ...rest }, ref) {
  if (/^(https?:|mailto:|blob:)/.test(href)) return <a ref={ref} href={href} {...rest} />;
  return <Link ref={ref} to={href} replace={replace} {...rest} />;
});

export default NextLink;
