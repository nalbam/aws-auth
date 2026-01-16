# Auth0 Provider Configuration
# This Terraform configuration sets up Auth0 as a federated identity provider

terraform {
  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "~> 1.0"
    }
  }
}

provider "auth0" {
  domain        = var.auth0_domain
  client_id     = var.auth0_client_id
  client_secret = var.auth0_client_secret
}

# Variables
variable "auth0_domain" {
  description = "Auth0 tenant domain"
  type        = string
}

variable "auth0_client_id" {
  description = "Auth0 Management API client ID"
  type        = string
}

variable "auth0_client_secret" {
  description = "Auth0 Management API client secret"
  type        = string
  sensitive   = true
}

variable "github_client_id" {
  description = "GitHub OAuth App Client ID"
  type        = string
}

variable "github_client_secret" {
  description = "GitHub OAuth App Client Secret"
  type        = string
  sensitive   = true
}

variable "aws_identity_center_domain" {
  description = "AWS IAM Identity Center domain (e.g., d-xxxxxxxxxx.awsapps.com)"
  type        = string
}

variable "allowed_orgs" {
  description = "List of allowed GitHub organizations (optional)"
  type        = list(string)
  default     = []
}

# GitHub Social Connection
resource "auth0_connection" "github" {
  name     = "github"
  strategy = "github"

  options {
    client_id     = var.github_client_id
    client_secret = var.github_client_secret
    scopes        = ["user:email", "read:org", "read:user"]

    set_user_root_attributes = "on_first_login"
    non_persistent_attrs     = []
  }
}

# Enable GitHub connection for AWS IAM Identity Center client
resource "auth0_connection_clients" "github_aws" {
  connection_id   = auth0_connection.github.id
  enabled_clients = [auth0_client.aws_identity_center.id]
}

# AWS IAM Identity Center SAML Application
resource "auth0_client" "aws_identity_center" {
  name        = "AWS IAM Identity Center"
  description = "SAML application for AWS IAM Identity Center federation"
  app_type    = "regular_web"

  callbacks = [
    "https://${var.aws_identity_center_domain}/start/saml2/acs"
  ]

  allowed_logout_urls = [
    "https://${var.aws_identity_center_domain}/start"
  ]

  is_first_party = true
  oidc_conformant = false
}

# SAML Addon Configuration
resource "auth0_client_addon_saml" "aws" {
  client_id = auth0_client.aws_identity_center.id

  audience    = "https://signin.aws.amazon.com/saml"
  recipient   = "https://${var.aws_identity_center_domain}/start/saml2/acs"
  destination = "https://${var.aws_identity_center_domain}/start/saml2/acs"

  mappings = {
    email    = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
    name     = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    nickname = "https://aws.amazon.com/SAML/Attributes/RoleSessionName"
  }

  name_identifier_format = "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent"
  
  name_identifier_probes = [
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
  ]

  signature_algorithm = "rsa-sha256"
  digest_algorithm    = "sha256"
  
  lifetime_in_seconds = 3600
  sign_response       = true
  
  include_attribute_name_format = true
  binding                        = "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
}

# Auth0 Action for GitHub Groups
resource "auth0_action" "github_groups" {
  name    = "add-github-groups-to-saml"
  runtime = "node18"
  deploy  = true

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  code = file("${path.module}/actions/github-groups.js")

  dependencies {
    name    = "axios"
    version = "latest"
  }
}

# Add Action to Login Flow
resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.github_groups.id
    display_name = auth0_action.github_groups.name
  }
}

# Outputs
output "auth0_saml_metadata_url" {
  description = "Auth0 SAML metadata URL for AWS configuration"
  value       = "https://${var.auth0_domain}/samlp/metadata/${auth0_client.aws_identity_center.client_id}"
}

output "auth0_saml_sso_url" {
  description = "Auth0 SAML SSO URL"
  value       = "https://${var.auth0_domain}/samlp/${auth0_client.aws_identity_center.client_id}"
}

output "aws_callback_url" {
  description = "AWS IAM Identity Center callback URL"
  value       = "https://${var.aws_identity_center_domain}/start/saml2/acs"
}
