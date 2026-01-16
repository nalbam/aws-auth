/**
 * Auth0 Action: Add GitHub Groups to SAML
 * This file is referenced by Terraform
 */

exports.onExecutePostLogin = async (event, api) => {
  if (event.client.name !== 'AWS IAM Identity Center') {
    return;
  }

  const githubIdentity = event.user.identities?.find(
    identity => identity.provider === 'github'
  );

  if (!githubIdentity) {
    console.log('No GitHub identity found for user');
    return;
  }

  const groups = [];
  const orgs = githubIdentity.profileData?.organizations || [];
  
  orgs.forEach(org => {
    groups.push(`github:${org.login}`);
  });

  if (groups.length > 0) {
    api.samlResponse.setAttribute(
      'https://aws.amazon.com/SAML/Attributes/Groups',
      groups
    );

    api.samlResponse.setAttribute(
      'https://aws.amazon.com/SAML/Attributes/PrincipalTag:GitHubOrgs',
      groups.join(',')
    );
  }

  console.log(`User ${event.user.email} has groups: ${groups.join(', ')}`);
};
