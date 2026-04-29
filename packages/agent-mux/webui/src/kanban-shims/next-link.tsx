import React from 'react';
import { Link as RouterLink, useInRouterContext } from 'react-router-dom-v6';

type LinkProps = Omit<React.ComponentPropsWithoutRef<typeof RouterLink>, 'to'> & {
  href: string;
};

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  const { href, ...rest } = props;
  const inRouterContext = useInRouterContext();
  if (!inRouterContext) {
    return <a ref={ref} href={href} {...rest} />;
  }
  return <RouterLink ref={ref} to={href} {...rest} />;
});

export default Link;
