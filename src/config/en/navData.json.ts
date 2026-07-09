interface NavItem {
  text: string;
  link: string;
}

const navConfig: NavItem[] = [
  { text: "Services", link: "/services/" },
  { text: "Technologies", link: "/technologies/" },
  { text: "About", link: "/about/" },
  { text: "Contact", link: "/contact/" },
];

export default navConfig;
