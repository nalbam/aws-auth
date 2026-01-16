/**
 * Auth0 Action: Add GitHub Groups to SAML
 * 
 * This Action adds GitHub organization and team memberships as groups
 * in the SAML assertion sent to AWS IAM Identity Center.
 * 
 * Deploy this Action and add it to the Login Flow.
 */

/**
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Only process for AWS SAML application
  if (event.client.name !== 'AWS IAM Identity Center') {
    return;
  }

  // Get GitHub identity
  const githubIdentity = event.user.identities?.find(
    identity => identity.provider === 'github'
  );

  if (!githubIdentity) {
    console.log('No GitHub identity found for user');
    return;
  }

  const groups = [];

  // Add GitHub organizations as groups
  const orgs = githubIdentity.profileData?.organizations || [];
  orgs.forEach(org => {
    groups.push(`github:${org.login}`);
  });

  // Optional: Add custom logic for organization filtering
  const ALLOWED_ORGS = ['your-org-name']; // Set your allowed organizations
  const orgNames = orgs.map(org => org.login);
  const hasAllowedOrg = orgNames.some(org => ALLOWED_ORGS.includes(org));

  if (!hasAllowedOrg && ALLOWED_ORGS.length > 0) {
    api.access.deny(
      'You must be a member of an authorized GitHub organization to access AWS'
    );
    return;
  }

  // Add groups to SAML assertion if any exist
  if (groups.length > 0) {
    api.samlResponse.setAttribute(
      'https://aws.amazon.com/SAML/Attributes/Groups',
      groups
    );

    // Optional: Add as principal tag for fine-grained permissions
    api.samlResponse.setAttribute(
      'https://aws.amazon.com/SAML/Attributes/PrincipalTag:GitHubOrgs',
      groups.join(',')
    );
  }

  // Log for debugging (remove in production)
  console.log(`User ${event.user.email} has groups: ${groups.join(', ')}`);
};

/**
 * Advanced Version: Fetch GitHub Teams
 * 
 * This enhanced version fetches GitHub team memberships using the GitHub API.
 * Requires a GitHub Personal Access Token stored in Auth0 Secrets.
 * 
 * To use:
 * 1. Create GitHub PAT with 'read:org' and 'read:team' scopes
 * 2. Add to Auth0 Secrets as GITHUB_ACCESS_TOKEN
 * 3. Add 'axios' dependency to this Action
 */
/*
const axios = require('axios');

exports.onExecutePostLogin = async (event, api) => {
  if (event.client.name !== 'AWS IAM Identity Center') {
    return;
  }

  const githubIdentity = event.user.identities?.find(id => id.provider === 'github');
  if (!githubIdentity) {
    return;
  }

  const githubUsername = githubIdentity.profileData.login;
  const groups = [];
  const orgs = githubIdentity.profileData.organizations || [];

  // Add organizations
  orgs.forEach(org => groups.push(`github:${org.login}`));

  // Fetch team memberships
  const token = event.secrets.GITHUB_ACCESS_TOKEN;
  
  for (const org of orgs) {
    try {
      const teamsResponse = await axios.get(
        `https://api.github.com/orgs/${org.login}/teams`,
        { headers: { 'Authorization': `token ${token}` } }
      );

      for (const team of teamsResponse.data) {
        try {
          await axios.get(
            `https://api.github.com/orgs/${org.login}/teams/${team.slug}/memberships/${githubUsername}`,
            { headers: { 'Authorization': `token ${token}` } }
          );
          groups.push(`github:${org.login}/${team.slug}`);
        } catch (err) {
          // User not a member, skip
        }
      }
    } catch (error) {
      console.error(`Error fetching teams for ${org.login}:`, error.message);
    }
  }

  if (groups.length > 0) {
    api.samlResponse.setAttribute(
      'https://aws.amazon.com/SAML/Attributes/Groups',
      groups
    );
  }
};
*/
