---
name: rpm-spec-generator
description: Generate RPM spec files for Fedora, RHEL, and CentOS distributions
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [linux, rpm, fedora, rhel, packaging]
---

# rpm-spec-generator

Generate RPM spec files for Fedora, RHEL, CentOS, and other RPM-based distributions.

## Capabilities

- Generate .spec files
- Configure package metadata
- Define build requirements
- Set up scriptlets
- Configure file lists
- Handle desktop integration
- Configure changelog

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "packageName": { "type": "string" },
    "version": { "type": "string" },
    "release": { "type": "string", "default": "1" },
    "buildRequires": { "type": "array" },
    "requires": { "type": "array" }
  },
  "required": ["projectPath", "packageName", "version"]
}
```

## Spec File Example

```spec
Name:           myapp
Version:        1.0.0
Release:        1%{?dist}
Summary:        My Application

License:        MIT
URL:            https://example.com/myapp
Source0:        %{name}-%{version}.tar.gz

BuildRequires:  gcc
Requires:       glibc, gtk3

%description
A longer description of my application.

%prep
%setup -q

%build
make %{?_smp_mflags}

%install
make install DESTDIR=%{buildroot}

%files
%{_bindir}/myapp
%{_datadir}/applications/myapp.desktop

%changelog
* Mon Jan 01 2024 Your Name <email@example.com> - 1.0.0-1
- Initial release
```

## Build Command

```bash
rpmbuild -ba myapp.spec
```

## Related Skills

- `deb-package-builder`
- `linux-gpg-signing`
