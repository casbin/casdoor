package object

import "github.com/casdoor/casdoor/util"

func InitDb() {
	initBuiltInOrganization()
	initBuiltInUser()
	initBuiltInApplication()
	initBuiltInLdap()
}

func initBuiltInOrganization() {
	organization := getOrganization("admin", "built-in")
	if organization != nil {
		return
	}

	organization = &Organization{
		Owner:        "admin",
		Name:         "built-in",
		CreatedTime:  util.GetCurrentTime(),
		DisplayName:  "Built-in Organization",
		WebsiteUrl:   "https://example.com",
		PasswordType: "plain",
	}
	AddOrganization(organization)
}

func initBuiltInUser() {
	user := getUser("built-in", "admin")
	if user != nil {
		return
	}

	user = &User{
		Owner:         "built-in",
		Name:          "admin",
		CreatedTime:   util.GetCurrentTime(),
		Id:            util.GenerateId(),
		Password:      "123",
		DisplayName:   "Admin",
		Avatar:        "https://casbin.org/img/casbin.svg",
		Email:         "admin@example.com",
		Phone:         "1-12345678",
		Affiliation:   "Example Inc.",
		Tag:           "staff",
		IsAdmin:       true,
		IsGlobalAdmin: true,
		IsForbidden:   false,
		Properties:    make(map[string]string),
	}
	AddUser(user)
}

func initBuiltInApplication() {
	application := getApplication("admin", "app-built-in")
	if application != nil {
		return
	}

	application = &Application{
		Owner:          "admin",
		Name:           "app-built-in",
		CreatedTime:    util.GetCurrentTime(),
		DisplayName:    "Casdoor",
		Logo:           "https://cdn.casbin.com/logo/logo_1024x256.png",
		HomepageUrl:    "https://casdoor.org",
		Organization:   "built-in",
		EnablePassword: true,
		EnableSignUp:   true,
		Providers:      []*ProviderItem{},
		SignupItems:    []*SignupItem{},
		RedirectUris:   []string{},
		ExpireInHours:  168,
	}
	AddApplication(application)
}

func initBuiltInLdap() {
	ldap := GetLdap("ldap-built-in")
	if ldap != nil {
		return
	}

	ldap = &Ldap{
		Id:         "ldap-built-in",
		Owner:      "built-in",
		ServerName: "BuildIn LDAP Server",
		Host:       "example.com",
		Port:       389,
		Admin:      "cn=buildin,dc=example,dc=com",
		Passwd:     "123",
		BaseDn:     "ou=BuildIn,dc=example,dc=com",
		AutoSync:   0,
		LastSync:   "",
	}
	AddLdap(ldap)
}
