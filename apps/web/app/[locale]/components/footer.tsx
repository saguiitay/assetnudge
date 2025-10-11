import Image from 'next/image';
import Link from "next/link";
import logoSmall from '@repo/design-system/images/logo-medium.webp';
import logoMedium from '@repo/design-system/images/logo-medium.webp';
import { env } from '@/env';

export const Footer = () => {
  const navigationItems = [
    {
      title: "Home",
      href: "/",
      description: "",
    },
    {
      title: "Categories",
      href: "/categories",
      description: "",
    },
    {
      title: "Product",
      description: "Managing a small business today is already tough.",
      href: env.NEXT_PUBLIC_APP_URL,
    },
    {
      title: "Company",
      description: "Managing a small business today is already tough.",
      items: [
        {
          title: "About us",
          href: "/about",
        },
        // {
        //   title: "Contact us",
        //   href: "/contact",
        // },
      ],
    },
  ];

  return (
    <div className="w-full py-20 bg-foreground text-background">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="flex gap-8 flex-col items-start">
            <div className="flex gap-2 flex-col">
              <div className="flex items-center gap-2">
          
               <Image
                  src={logoSmall}
                  alt="Logo"
                  className="dark:invert"
                  width={48}
                  height={48}
                  priority
                />
              <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
                Asset Nudge
              </h2>
              </div>
              <p className="text-lg max-w-lg leading-relaxed tracking-tight text-background/75 text-left">
                Helping Unity Asset developers maximize their store presence and revenue.
              </p>
            </div>
            <div className="flex gap-20 flex-row">
              <div className="flex flex-col text-sm max-w-lg leading-relaxed tracking-tight text-background/75 text-left">
                <Link href="/">Terms of service</Link>
                <Link href="/">Privacy Policy</Link>
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-10 items-start">
            {navigationItems.map((item) => (
              <div
                key={item.title}
                className="flex text-base gap-1 flex-col items-start"
              >
                <div className="flex flex-col gap-2">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex justify-between items-center"
                    >
                      <span className="text-xl">{item.title}</span>
                    </Link>
                  ) : (
                    <p className="text-xl">{item.title}</p>
                  )}
                  {item.items &&
                    item.items.map((subItem) => (
                      <Link
                        key={subItem.title}
                        href={subItem.href}
                        className="flex justify-between items-center"
                      >
                        <span className="text-background/75">
                          {subItem.title}
                        </span>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};