// GitHub API client for fetching repository data
import { Octokit } from '@octokit/rest';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface Commit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  parents: Array<{
    sha: string;
  }>;
}

export interface NetworkData {
  repository: Repository;
  branches: Branch[];
  commits: Commit[];
  forks: Repository[];
}

export class GitHubApiClient {
  private octokit: Octokit;

  constructor(octokit: Octokit) {
    this.octokit = octokit;
  }

  async getUserRepositories(page: number = 1, perPage: number = 30): Promise<Repository[]> {
    try {
      const response = await this.octokit.rest.repos.listForAuthenticatedUser({
        page,
        per_page: perPage,
        sort: 'updated',
        type: 'all',
      });
      return response.data as Repository[];
    } catch (error) {
      console.error('Error fetching user repositories:', error);
      throw error;
    }
  }

  async searchRepositories(query: string, page: number = 1): Promise<Repository[]> {
    try {
      const response = await this.octokit.rest.search.repos({
        q: query,
        page,
        per_page: 30,
        sort: 'updated',
      });
      return response.data.items as Repository[];
    } catch (error) {
      console.error('Error searching repositories:', error);
      throw error;
    }
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      });
      return response.data as Repository;
    } catch (error) {
      console.error('Error fetching repository:', error);
      throw error;
    }
  }

  async getBranches(owner: string, repo: string): Promise<Branch[]> {
    try {
      const response = await this.octokit.rest.repos.listBranches({
        owner,
        repo,
        per_page: 100,
      });
      return response.data as Branch[];
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  }

  async getCommits(owner: string, repo: string, sha?: string, perPage: number = 100): Promise<Commit[]> {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        sha,
        per_page: perPage,
      });
      return response.data as Commit[];
    } catch (error) {
      console.error('Error fetching commits:', error);
      throw error;
    }
  }

  async getForks(owner: string, repo: string): Promise<Repository[]> {
    try {
      const response = await this.octokit.rest.repos.listForks({
        owner,
        repo,
        per_page: 100,
        sort: 'newest',
      });
      return response.data as Repository[];
    } catch (error) {
      console.error('Error fetching forks:', error);
      throw error;
    }
  }

  async getNetworkData(owner: string, repo: string): Promise<NetworkData> {
    try {
      const [repository, branches, commits, forks] = await Promise.all([
        this.getRepository(owner, repo),
        this.getBranches(owner, repo),
        this.getCommits(owner, repo),
        this.getForks(owner, repo),
      ]);

      // Get commits for each branch to build a complete network view
      const branchCommits = await Promise.all(
        branches.slice(0, 10).map(async (branch) => { // Limit to 10 branches for performance
          try {
            return await this.getCommits(owner, repo, branch.commit.sha, 50);
          } catch {
            return [];
          }
        })
      );

      // Flatten and deduplicate commits
      const allCommits = [
        ...commits,
        ...branchCommits.flat(),
      ];

      const uniqueCommits = allCommits.filter(
        (commit, index, self) =>
          index === self.findIndex((c) => c.sha === commit.sha)
      );

      return {
        repository,
        branches,
        commits: uniqueCommits,
        forks,
      };
    } catch (error) {
      console.error('Error fetching network data:', error);
      throw error;
    }
  }
}